# Firestore Security Rules

This document outlines the recommended Firestore Security Rules for the Dimah PVT LTD Inventory Management System.

## Rules Overview

The security rules should enforce role-based access control (RBAC) to ensure users can only access and modify data appropriate to their role.

## Recommended Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user role from users collection
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() && getUserRole() == 'super_admin';
    }
    
    // Helper function to check if user is inventory manager
    function isInventoryManager() {
      return isAuthenticated() && getUserRole() == 'inventory_manager';
    }
    
    // Helper function to check if user is approver
    function isApprover() {
      return isAuthenticated() && 
             (getUserRole() == 'head_finance' || getUserRole() == 'head_it');
    }
    
    // Helper function to check if user is staff
    function isStaff() {
      return isAuthenticated() && getUserRole() == 'staff';
    }
    
    // Helper function to check if user owns the document
    function isOwner(userIdField) {
      return isAuthenticated() && request.auth.uid == resource.data[userIdField];
    }

    // Users collection - only super admin can manage users
    match /users/{userId} {
      allow read: if isSuperAdmin() || request.auth.uid == userId;
      allow write: if isSuperAdmin();
    }
    
    // Categories - inventory managers and super admin can manage
    match /categories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Suppliers - inventory managers and super admin can manage
    match /suppliers/{supplierId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Departments - inventory managers and super admin can manage
    match /departments/{departmentId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Staff - inventory managers and super admin can manage
    match /staff/{staffId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Inventory - inventory managers and super admin can manage, others can read
    match /inventory/{itemId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Stock Requests - staff can create their own, approvers can approve, inventory managers can manage
    match /stockRequests/{requestId} {
      allow read: if isSuperAdmin() || 
                     isInventoryManager() || 
                     isApprover() || 
                     isOwner('requestingStaff');
      allow create: if isStaff() && isOwner('requestingStaff');
      allow update: if isSuperAdmin() || 
                      isInventoryManager() || 
                      isApprover();
      allow delete: if isSuperAdmin() || isInventoryManager();
    }
    
    // Stock Receipts - inventory managers and super admin can manage
    match /stockReceipts/{receiptId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Stock Issues - inventory managers and super admin can manage
    match /stockIssues/{issueId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin() || isInventoryManager();
    }
    
    // Stock Transactions - read-only for all authenticated users
    match /stockTransactions/{transactionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Transactions are created by system only
    }
  }
}
```

## Role-Based Access Summary

| Role | Users | Categories | Suppliers | Departments | Staff | Inventory | Stock Requests | Stock Receipts | Stock Issues | Stock Transactions |
|------|-------|------------|-----------|-------------|-------|-----------|----------------|----------------|--------------|-------------------|
| super_admin | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read |
| inventory_manager | Read (own) | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read |
| head_finance | Read (own) | Read | Read | Read | Read | Read | Read/Write (approve) | Read | Read | Read |
| head_it | Read (own) | Read | Read | Read | Read | Read | Read/Write (approve) | Read | Read | Read |
| staff | Read (own) | Read | Read | Read | Read | Read | Create (own), Read | Read | Read | Read |

## Implementation Steps

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the rules above
3. Paste them into the rules editor
4. Click "Publish" to apply the rules

## Important Notes

- The rules assume that user roles are stored in the `users` collection with a `role` field
- User IDs in Firestore should match Firebase Authentication UIDs
- Stock transactions are created by the system and should not be directly writable by users
- Staff can only create stock requests for themselves (requestingStaff field must match their own ID)
- Approvers can only update stock requests to approve/reject them
