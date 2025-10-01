# TODO: Fix Group ID Issue in Group Detail Page

## Steps to Complete
- [x] Unify group ID parameter usage to "groupId" in client/scripts/group-detail.js
- [x] Modify loadGroupDetails() to use the global groupId variable set by resolveGroupId()
- [x] Remove duplicate loadGroupDetails() definitions in client/scripts/group-detail.js
- [x] Ensure groupId is resolved once on DOMContentLoaded and used consistently
- [ ] Test group detail page with URL parameter "groupId" to confirm group details load correctly

# TODO: Modify Teacher Permissions in Presentation Detail Page

## Steps to Complete
- [x] Modify server/controllers/pres-detailController.js to set canUpload and canEditDescription to false for teachers
- [ ] Test presentation detail page as teacher to confirm upload and description edit are disabled
- [ ] Test that note and feedback functionality still works for teacher
