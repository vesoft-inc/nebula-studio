# Datasource Grant Smoke Cases

## Scope
- Page: `Import -> Datasource Management`
- Tabs: `Object Storage (S3)` and `SFTP`
- Feature: datasource grant management

## Preconditions
- Have at least 3 users: `root`, `alice`, `bob`
- `alice` creates one S3 datasource `alice-s3` and one SFTP datasource `alice-sftp`
- `bob` creates one S3 datasource `bob-s3`

## Case 1: Root can grant any S3/SFTP datasource
1. Login as `root`, open S3 list.
2. Click `Grant` on `alice-s3`.
3. Add `bob` and save.
4. Re-open grant modal for `alice-s3`.

Expected:
- `Grant` button is enabled for all S3/SFTP rows.
- Save succeeds.
- Re-opened grant list contains `bob`.

## Case 2: Non-root can only manage own datasource grants
1. Login as `bob`, open S3 list.
2. Check row actions on `alice-s3` and `bob-s3`.
3. Try to open grant modal on `alice-s3` (should be disabled).
4. Open grant modal on `bob-s3`, add `alice`, save.

Expected:
- `alice-s3` row: `Grant` button disabled with permission tooltip.
- `bob-s3` row: `Grant` enabled and save succeeds.

## Case 3: Non-root cannot edit/delete non-owned datasource rows
1. Still as `bob`, inspect `alice-s3` row actions.
2. Inspect `bob-s3` row actions.

Expected:
- `alice-s3` row `edit/delete` are disabled.
- `bob-s3` row `edit/delete` are enabled.

## Case 4: Granted user can see and use granted datasource in import mapping
1. Login as `bob`.
2. Go to `Import -> Create Task -> File Mapping`.
3. Open datasource selector.

Expected:
- `alice-s3` appears in selector after `alice` grants it to `bob`.
- Files can be browsed/previewed for the granted datasource.

## Case 5: Remove grant takes effect
1. Login as datasource owner (`alice`) and remove `bob` from `alice-s3` grants.
2. Login as `bob`, refresh datasource list and file mapping selector.

Expected:
- `alice-s3` disappears from `bob` list/selector.
- If direct grant API is called by `bob` for `alice-s3`, backend returns forbidden.
