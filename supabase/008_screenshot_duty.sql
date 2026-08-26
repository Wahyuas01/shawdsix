-- ================================================================
-- SHAW D'SIX PORTAL — Screenshot On Duty & Off Duty
-- ================================================================
alter table duty_mekanik add column if not exists foto_on_duty_url text;
alter table duty_mekanik add column if not exists foto_off_duty_url text;
