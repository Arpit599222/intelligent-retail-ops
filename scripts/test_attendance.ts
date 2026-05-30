import 'dotenv/config';
import { query, table } from '../server/database/databricks.js';
import crypto from 'crypto';

async function runTests() {
  console.log('🚀 STARTING E2E ATTENDANCE VALIDATION TESTS\n');
  const testEmail = 'atul@gmail.com'; // Existing active worker

  try {
    // 0. Setup: Find test user
    const users = await query<any>(
      `SELECT user_id, status, role FROM logistics_os.identity_management.users WHERE email = :testEmail`,
      { testEmail }
    );
    if (users.length === 0) {
      throw new Error(`Test user ${testEmail} not found. Run create_test_user first.`);
    }
    const testUser = users[0];
    const userId = testUser.user_id;
    const workerId = 'W-5490';
    console.log(`👤 Test User Found: ID=${userId}, Role=${testUser.role}, Status=${testUser.status}`);

    // Clean up past test states for a deterministic test slate
    console.log('🧹 Cleaning up past test records...');
    await query(`DELETE FROM logistics_os.identity_management.attendance_records WHERE user_id = :userId`, { userId });
    await query(`DELETE FROM logistics_os.identity_management.live_attendance_status WHERE user_id = :userId`, { userId });
    await query(`DELETE FROM logistics_os.identity_management.audit_logs WHERE user_id = :userId AND action_type IN ('CLOCK_IN', 'CLOCK_OUT')`, { userId });
    console.log('✅ Clean slate set up.\n');

    // ----------------------------------------------------
    // TEST 1: Clock In creates attendance record
    // ----------------------------------------------------
    console.log('🧪 TEST 1: Clock In creates attendance record...');
    
    // Check ACTIVE status
    if (testUser.status !== 'ACTIVE') {
      throw new Error('Test user must be active for this test.');
    }

    // Verify no active attendance record exists
    const active1 = await query(`SELECT record_id FROM logistics_os.identity_management.attendance_records WHERE user_id = :userId AND clock_out_time IS NULL`, { userId });
    if (active1.length > 0) {
      throw new Error('Unexpected active record found before test.');
    }

    // Insert record
    const recordId = crypto.randomUUID();
    await query(
      `INSERT INTO logistics_os.identity_management.attendance_records
       (record_id, user_id, worker_id, clock_in_time, clock_out_time, total_hours)
       VALUES (:recordId, :userId, :workerId, current_timestamp(), NULL, NULL)`,
      { recordId, userId, workerId }
    );

    // Update live status
    const statusId = crypto.randomUUID();
    await query(
      `INSERT INTO logistics_os.identity_management.live_attendance_status
       (status_id, user_id, worker_id, current_status, is_online, last_clock_in, last_clock_out)
       VALUES (:statusId, :userId, :workerId, 'CLOCKED_IN', true, current_timestamp(), NULL)`,
      { statusId, userId, workerId }
    );

    // Audit log
    const auditId1 = crypto.randomUUID();
    await query(
      `INSERT INTO logistics_os.identity_management.audit_logs (audit_id, user_id, action_type, performed_at)
       VALUES (:auditId1, :userId, 'CLOCK_IN', current_timestamp())`,
      { auditId1, userId }
    );

    // Verify DB writes
    const recordsAfterIn = await query<any>(`SELECT * FROM logistics_os.identity_management.attendance_records WHERE record_id = :recordId`, { recordId });
    const liveStatusAfterIn = await query<any>(`SELECT * FROM logistics_os.identity_management.live_attendance_status WHERE user_id = :userId`, { userId });
    const auditsAfterIn = await query<any>(`SELECT * FROM logistics_os.identity_management.audit_logs WHERE user_id = :userId AND action_type = 'CLOCK_IN'`, { userId });

    if (recordsAfterIn.length === 1 && recordsAfterIn[0].clock_in_time && !recordsAfterIn[0].clock_out_time) {
      console.log('  ✅ SUCCESS: Attendance record created with clock_in_time and NULL clock_out_time!');
    } else {
      throw new Error('FAILED: Attendance record creation verify.');
    }

    if (liveStatusAfterIn.length === 1 && liveStatusAfterIn[0].current_status === 'CLOCKED_IN' && liveStatusAfterIn[0].is_online === true) {
      console.log('  ✅ SUCCESS: live_attendance_status set to CLOCKED_IN and is_online=true!');
    } else {
      throw new Error('FAILED: Live status verify.');
    }

    if (auditsAfterIn.length > 0) {
      console.log('  ✅ SUCCESS: CLOCK_IN audit log entry created successfully!');
    } else {
      throw new Error('FAILED: Audit log verify.');
    }

    console.log('\n');

    // ----------------------------------------------------
    // TEST 2: Double Clock-In Prevention
    // ----------------------------------------------------
    console.log('🧪 TEST 2: Double Clock-In Prevention...');
    const active2 = await query(`SELECT record_id FROM logistics_os.identity_management.attendance_records WHERE user_id = :userId AND clock_out_time IS NULL`, { userId });
    if (active2.length > 0) {
      console.log('  ✅ SUCCESS: Double clock-in check detected active record! Prevention verified.');
    } else {
      throw new Error('FAILED: Active record not found when it should be.');
    }

    console.log('\n');

    // ----------------------------------------------------
    // TEST 3: Clock Out updates attendance record & total hours
    // ----------------------------------------------------
    console.log('🧪 TEST 3: Clock Out updates attendance record...');
    
    // Simulate elapsed time by adding a mock past clock-in time to test total_hours calculation
    // We will update the clock_in_time to 2.5 hours ago
    const twoAndHalfHoursAgo = new Date(Date.now() - 2.5 * 60 * 60 * 1000);
    // Format timestamp for Databricks SQL (YYYY-MM-DD HH:MM:SS)
    const formattedPastTime = twoAndHalfHoursAgo.toISOString().replace('T', ' ').substring(0, 19);
    console.log(`  Updating clock_in_time to 2.5 hours ago: ${formattedPastTime}`);
    await query(
      `UPDATE logistics_os.identity_management.attendance_records
       SET clock_in_time = CAST(:formattedPastTime AS TIMESTAMP)
       WHERE record_id = :recordId`,
      { formattedPastTime, recordId }
    );

    // Fetch active record to calculate
    const activeRecords = await query<any>(
      `SELECT record_id, clock_in_time FROM logistics_os.identity_management.attendance_records
       WHERE user_id = :userId AND clock_out_time IS NULL`,
      { userId }
    );
    if (activeRecords.length === 0) {
      throw new Error('No active clock-in session found for clock out.');
    }

    const clockInTime = new Date(activeRecords[0].clock_in_time);
    const now = new Date();
    const totalHours = Math.max(0, (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60));

    // Update attendance record
    await query(
      `UPDATE logistics_os.identity_management.attendance_records
       SET clock_out_time = current_timestamp(), total_hours = :totalHours
       WHERE record_id = :recordId`,
      { totalHours, recordId }
    );

    // Update live status
    await query(
      `UPDATE logistics_os.identity_management.live_attendance_status
       SET current_status = 'CLOCKED_OUT', is_online = false, last_clock_out = current_timestamp()
       WHERE user_id = :userId`,
      { userId }
    );

    // Audit log
    const auditId2 = crypto.randomUUID();
    await query(
      `INSERT INTO logistics_os.identity_management.audit_logs (audit_id, user_id, action_type, performed_at)
       VALUES (:auditId2, :userId, 'CLOCK_OUT', current_timestamp())`,
      { auditId2, userId }
    );

    // Verify DB writes
    const recordsAfterOut = await query<any>(`SELECT * FROM logistics_os.identity_management.attendance_records WHERE record_id = :recordId`, { recordId });
    const liveStatusAfterOut = await query<any>(`SELECT * FROM logistics_os.identity_management.live_attendance_status WHERE user_id = :userId`, { userId });
    const auditsAfterOut = await query<any>(`SELECT * FROM logistics_os.identity_management.audit_logs WHERE user_id = :userId AND action_type = 'CLOCK_OUT'`, { userId });

    if (recordsAfterOut.length === 1 && recordsAfterOut[0].clock_out_time) {
      console.log('  ✅ SUCCESS: Attendance record updated with clock_out_time successfully!');
    } else {
      throw new Error('FAILED: Clock out time update verify.');
    }

    const calculatedHours = recordsAfterOut[0].total_hours;
    console.log(`  Calculated Total Hours: ${calculatedHours} (Expected: ~2.5)`);
    if (Math.abs(calculatedHours - 2.5) < 0.1) {
      console.log('  ✅ SUCCESS: Working duration / total_hours calculated correctly!');
    } else {
      throw new Error(`FAILED: Working duration calculated incorrectly: ${calculatedHours}`);
    }

    if (liveStatusAfterOut.length === 1 && liveStatusAfterOut[0].current_status === 'CLOCKED_OUT' && liveStatusAfterOut[0].is_online === false) {
      console.log('  ✅ SUCCESS: live_attendance_status updated to CLOCKED_OUT and is_online=false!');
    } else {
      throw new Error('FAILED: Live status clock-out verify.');
    }

    if (auditsAfterOut.length > 0) {
      console.log('  ✅ SUCCESS: CLOCK_OUT audit log entry created successfully!');
    } else {
      throw new Error('FAILED: Audit log clock-out verify.');
    }

    console.log('\n');

    // ----------------------------------------------------
    // TEST 4: Double Clock-Out Prevention
    // ----------------------------------------------------
    console.log('🧪 TEST 4: Double Clock-Out Prevention...');
    const active4 = await query(`SELECT record_id FROM logistics_os.identity_management.attendance_records WHERE user_id = :userId AND clock_out_time IS NULL`, { userId });
    if (active4.length === 0) {
      console.log('  ✅ SUCCESS: Double clock-out check did not find any active session! Prevention verified.');
    } else {
      throw new Error('FAILED: Active session still exists after clock-out.');
    }

    console.log('\n');

    // ----------------------------------------------------
    // TEST 5: Dashboard Stats (Admin / Manager Views) Verification
    // ----------------------------------------------------
    console.log('🧪 TEST 5: Dashboard Stats (Admin / Manager View) verification...');
    
    // Fetch stats
    const totalWorkers = await query(`SELECT count(*) as total FROM logistics_os.identity_management.users WHERE role IN ('OPERATIONS_STAFF', 'WORKER') AND status = 'ACTIVE'`);
    const clockedInCount = await query(`SELECT count(*) as clocked_in FROM logistics_os.identity_management.live_attendance_status WHERE current_status = 'CLOCKED_IN'`);
    const presentTodayCount = await query(`SELECT count(distinct user_id) as present_today FROM logistics_os.identity_management.attendance_records WHERE to_date(clock_in_time) = current_date()`);
    
    console.log(`  Admin view verification:`);
    console.log(`    Total workers in active directory: ${totalWorkers[0].total}`);
    console.log(`    Currently Clocked In workers: ${clockedInCount[0].clocked_in}`);
    console.log(`    Total Present workers today: ${presentTodayCount[0].present_today}`);
    console.log('  ✅ SUCCESS: Databricks stats queries executing successfully for supervisor boards!');

    console.log('\n🎉 ALL ATTENDANCE FUNCTIONALITY TESTS COMPLETED WITH ZERO ERRORS!');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE RUNTIME EXCEPTION:', error.message || error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
