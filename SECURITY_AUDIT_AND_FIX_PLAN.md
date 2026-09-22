# Spice Tree Application: Security Audit & Full Remediation Plan
> **Designed for Google AI Studio / Antigravity Implementation**  
> Target Project: `spice-tree` (Pure Vegetarian Restaurant App)  
> Firebase Project: `pure-pad-x6pck` | Custom Database: `ai-studio-spicetree-667071d5-bbb8-460a-b9f1-fa9a17346e78`

---

## SECTION 1: EXECUTIVE SUMMARY OF FINDINGS

During the comprehensive security and functional audit, multiple critical flaws were identified across the backend configuration, security rules, and frontend authentication flow:

| # | Severity | Category | Vulnerability / Issue | Impact |
|---|---|---|---|---|
| **1** | **CRITICAL** | Firebase Console | **Email/Password Provider Disabled** | Real user registration/login fails with `OPERATION_NOT_ALLOWED`. Code was masking this by creating fake dummy accounts in `localStorage`. |
| **2** | **CRITICAL** | Firestore Deployment | **Database Rules Not Deployed (HTTP 403)** | Custom Firestore database returns `PERMISSION_DENIED`. Order creation, table reservations, and live menu fetching fail. |
| **3** | **CRITICAL** | Security Rules | **Wildcard `allow read, write: if true;`** | All customer PII (names, phone numbers, home delivery addresses, table bookings) is publicly readable and writable by anyone on the internet. |
| **4** | **CRITICAL** | Auth Logic | **Admin Password Bypass in `AdminLogin.tsx`** | Wrong password triggers a swallowed error, causing the code to log anyone in as Super Admin with ANY password. |
| **5** | **HIGH** | Session Logic | **Admin Impersonation via `localStorage`** | Anyone can set `localStorage.setItem('spicetree_admin_session', ...)` in DevTools to obtain Super Admin privileges without logging in. |
| **6** | **MEDIUM** | Data Privacy | **Order Querying by Name in `MyOrdersView.tsx`** | Orders do not store `userId`. Orders are queried by `customerName`. Any two users with the same name see each other's orders and addresses. |

---

## SECTION 2: DETAILED ISSUES & LIVE EVIDENCE

### 1. Firebase Email/Password Sign-In is Disabled
* **Evidence:** Live HTTP request to Google Identity Toolkit:
  * `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=...` returns:
    ```json
    { "error": { "code": 400, "message": "OPERATION_NOT_ALLOWED" } }
    ```
  * `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=...` returns:
    ```json
    { "error": { "code": 400, "message": "PASSWORD_LOGIN_DISABLED" } }
    ```
* **Frontend Flaw:** In `src/components/AuthModal.tsx` and `src/components/admin/AdminLogin.tsx`, the code caught `auth/operation-not-allowed` and assigned `uid: 'user-' + Date.now()` in browser storage. Real accounts were never created.

---

### 2. Live Firestore Custom Database Returns HTTP 403 `PERMISSION_DENIED`
* **Evidence:** Probing `https://firestore.googleapis.com/v1/projects/pure-pad-x6pck/databases/ai-studio-spicetree-667071d5-bbb8-460a-b9f1-fa9a17346e78/documents/menuItems?key=...` returns:
  ```json
  { "error": { "code": 403, "message": "Missing or insufficient permissions.", "status": "PERMISSION_DENIED" } }
  ```
* **Impact:** Every order creation (`setDoc(doc(db, 'orders', ...))`) fails in `CheckoutView.tsx`, triggering *"Failed to place order"*. Table booking in `ReservationModal.tsx` fails. The menu only renders because it falls back to hardcoded in-memory arrays in `src/data/seedData.ts`.

---

### 3. Wildcard `allow read, write: if true;` in `firestore.rules`
* **Current Code:**
  ```rules
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /menuItems/{itemId} { allow read, write: if true; }
      match /deliveryZones/{zoneId} { allow read, write: if true; }
      match /orders/{orderId} { allow read, write: if true; }
      match /reservations/{reservationId} { allow read, write: if true; }
      match /admins/{adminId} { allow read, write: if true; }
      match /settings/{settingId} { allow read, write: if true; }
    }
  }
  ```
* **Exploit:**
  * Anyone can read all documents in `/orders/` and `/reservations/` (exposing customer names, delivery addresses, and phone numbers).
  * Anyone can write to `/admins/{adminId}` and grant themselves administrator rights.
  * Anyone can edit `/settings/` or `/menuItems/` to change dish prices or delivery charges.

---

### 4. Admin Password Bypass in `src/components/admin/AdminLogin.tsx`
* **Current Code (Lines 147–191):**
  ```typescript
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  } catch (signInErr: unknown) {
    const authError = signInErr as { code?: string };
    if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    }
  } catch (fbAuthErr: unknown) {
    const fbErr = fbAuthErr as { code?: string };
    if (fbErr.code === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    }
    // Any other error code is silently swallowed!
  }
  // Code execution continues here and logs user in:
  localStorage.setItem('spicetree_admin_session', JSON.stringify(adminData));
  ```
* **Exploit:** In Firebase v10+, an incorrect password returns `auth/invalid-credential`. The code then calls `createUserWithEmailAndPassword`, which throws `auth/email-already-in-use`. Since `email-already-in-use` is not `wrong-password`, the catch block ignores it and proceeds to line 183, setting the admin session and logging the attacker in as Super Admin.

---

### 5. Admin Impersonation via `localStorage` in `src/components/admin/AdminView.tsx`
* **Current Code (Lines 66–110):**
  ```typescript
  let storedSessionEmail = JSON.parse(localStorage.getItem('spicetree_admin_session'))?.email;
  const activeEmail = auth.currentUser?.email || currentUser?.email || user?.email || storedSessionEmail || '';
  if (activeEmail === 'tyagiaayush3030@gmail.com') {
    setIsAuthorizedAdmin(true); // Super Admin Access Granted!
  }
  ```
* **Exploit:** Setting `localStorage.setItem('spicetree_admin_session', JSON.stringify({email: 'tyagiaayush3030@gmail.com'}))` in browser console gives permanent Super Admin access without entering any password.

---

### 6. Order Querying by Display Name in `src/components/MyOrdersView.tsx`
* **Current Code:**
  ```typescript
  // CheckoutView.tsx: newOrder has no userId
  const newOrder: Order = { id: docId, customerName, phone, ... };

  // MyOrdersView.tsx: Queries orders by customerName
  const q = query(ordersRef, where('customerName', '==', user.displayName || user.email));
  ```
* **Exploit:** Any user who logs in with a name matching another customer's name will see that customer's complete order history, phone numbers, and addresses.

---

## SECTION 3: STEP-BY-STEP REMEDIATION GUIDE

### Step 1: Firebase Console Actions (Required)
1. Go to [Firebase Console](https://console.firebase.google.com/) > Select **`pure-pad-x6pck`**.
2. Navigate to **Build** > **Authentication** > **Sign-in method**.
3. Click **Email/Password** and toggle **Enable**. Click **Save**.
4. Navigate to **Firestore Database** > Select database **`ai-studio-spicetree-667071d5-bbb8-460a-b9f1-fa9a17346e78`** > Click **Rules** tab.
5. Paste the hardened security rules from **Step 2** below and click **Publish**.

---

### Step 2: Deploy Production-Grade Firestore Security Rules
Replace the entire contents of `firestore.rules` with:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: Checks if the requester is an authorized admin
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'tyagiaayush3030@gmail.com' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        (request.auth.token.email != null && exists(/databases/$(database)/documents/admins/$(request.auth.token.email)))
      );
    }

    // Menu Items: Read by anyone; modified ONLY by admins
    match /menuItems/{itemId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Delivery Zones: Read by anyone; modified ONLY by admins
    match /deliveryZones/{zoneId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Orders:
    // - Customers (guest or authenticated) can create an order with validated fields
    // - Authenticated users can read only their own orders
    // - Admins can read, update status, and manage all orders
    match /orders/{orderId} {
      allow create: if request.resource.data.customerName is string &&
                       request.resource.data.phone is string &&
                       request.resource.data.total is number &&
                       request.resource.data.items is list;
      allow read: if isAdmin() || (
        request.auth != null && (
          resource.data.userId == request.auth.uid ||
          (resource.data.customerEmail != null && resource.data.customerEmail == request.auth.token.email)
        )
      );
      allow update, delete: if isAdmin();
    }
    
    // Reservations:
    // - Customers can submit reservations with valid structure
    // - Only admins can view, update, or cancel reservations
    match /reservations/{reservationId} {
      allow create: if request.resource.data.name is string &&
                       request.resource.data.phone is string &&
                       request.resource.data.date is string &&
                       request.resource.data.guests is number;
      allow read, update, delete: if isAdmin();
    }

    // Admins Whitelist:
    // - Only the designated Super Admin (tyagiaayush3030@gmail.com) can add or remove admins
    // - Authenticated users can check if their own ID/email exists in the admin list
    match /admins/{adminId} {
      allow read: if isAdmin() || (
        request.auth != null && (
          request.auth.uid == adminId ||
          request.auth.token.email == adminId
        )
      );
      allow write: if request.auth != null && request.auth.token.email == 'tyagiaayush3030@gmail.com';
    }

    // Restaurant Settings (operating hours, fees, taxes):
    // - Read by anyone so customer frontend functions properly
    // - Modified ONLY by admins
    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

### Step 3: Fix Admin Login (`src/components/admin/AdminLogin.tsx`)
Replace the authentication logic in `handleAuth` so that password authentication is strictly enforced without bypass:

```typescript
// Replace lines 147-191 in src/components/admin/AdminLogin.tsx with:
try {
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  } catch (signInErr: any) {
    if (signInErr.code === 'auth/user-not-found') {
      // If user doc exists in Firestore admins but no Auth account yet, register them
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (authenticatedName) {
        await updateProfile(userCredential.user, { displayName: authenticatedName });
      }
    } else {
      // Re-throw invalid-credential or wrong-password to reject bad passwords!
      throw signInErr;
    }
  }

  authenticatedUid = userCredential.user.uid;
  if (userCredential.user.displayName) {
    authenticatedName = userCredential.user.displayName;
  }

  const adminData = {
    id: authenticatedUid,
    email: cleanEmail,
    name: authenticatedName,
    role: matchedAdmin.role || 'Super Admin',
    addedAt: Date.now()
  };

  localStorage.setItem('spicetree_admin_session', JSON.stringify(adminData));
  setAppUser({
    uid: authenticatedUid,
    email: cleanEmail,
    displayName: authenticatedName,
  });

  setSuccessMessage(`Authenticated as ${authenticatedName}! Loading Admin Terminal...`);
  setTimeout(() => {
    if (onAdminAuthenticated) onAdminAuthenticated();
    window.location.reload();
  }, 500);

} catch (authErr: any) {
  setIsLoading(false);
  console.error('Admin authentication failure:', authErr);
  if (
    authErr.code === 'auth/wrong-password' ||
    authErr.code === 'auth/invalid-credential'
  ) {
    setErrorMessage('Incorrect password. Please verify your admin credentials.');
  } else if (authErr.code === 'auth/operation-not-allowed') {
    setErrorMessage('Email/Password authentication is disabled in Firebase Console. Please enable it.');
  } else {
    setErrorMessage(authErr.message || 'Authentication failed. Please try again.');
  }
  return;
}
```

---

### Step 4: Fix Admin View Session Validation (`src/components/admin/AdminView.tsx`)
In `src/components/admin/AdminView.tsx`, ensure that admin access is only granted if `auth.currentUser` is verified:

```typescript
// Replace lines 63-83 in src/components/admin/AdminView.tsx:
const verifiedUser = auth.currentUser;
const activeEmail = (verifiedUser?.email || '').trim().toLowerCase();

if (activeEmail) {
  const matched = adminDocs.find(
    a => a.email && a.email.toLowerCase() === activeEmail
  );

  const isSuperAdminOwner = activeEmail === 'tyagiaayush3030@gmail.com';

  if (matched || isSuperAdminOwner) {
    const adminDoc = matched || {
      id: verifiedUser?.uid || 'admin-super-owner',
      email: 'tyagiaayush3030@gmail.com',
      name: verifiedUser?.displayName || 'Aayush Tyagi',
      role: 'Super Admin',
      addedAt: Date.now()
    };
    setAdminRecord(adminDoc);
    setIsAuthorizedAdmin(true);
    setRevocationNotice(null);
  } else {
    localStorage.removeItem('spicetree_admin_session');
    setIsAuthorizedAdmin(false);
    setAdminRecord(null);
    setRevocationNotice(`Administrator access for "${activeEmail}" is not authorized.`);
  }
} else {
  // Not logged in with a real Firebase user
  localStorage.removeItem('spicetree_admin_session');
  setIsAuthorizedAdmin(false);
  setAdminRecord(null);
}
```

---

### Step 5: Attach `userId` and `customerEmail` to Orders (`src/components/CheckoutView.tsx`)
In `src/components/CheckoutView.tsx`, include the user's authenticated ID and email when creating an order:

```typescript
// In src/components/CheckoutView.tsx, update newOrder (line 203):
const newOrder: Order = {
  id: docId,
  orderNumber: orderRefId,
  items: orderItems,
  userId: user?.uid || null,
  customerEmail: user?.email || null,
  customerName: customerName.trim(),
  phone: phone.trim(),
  orderType,
  address: fullAddress,
  locality: selectedLocality || '',
  pincode: selectedPincode || '',
  houseNo: houseNo.trim() || '',
  street: street.trim() || '',
  landmark: landmark.trim() || '',
  deliveryInstructions: deliveryInstructions.trim() || '',
  tableNumber: orderType === 'dinein' ? `Dine-In (${finalGuests})` : '',
  numberOfGuests: orderType === 'dinein' ? finalGuests : '',
  expectedArrivalTime: orderType === 'dinein' ? finalArrivalTime : '',
  paymentMethod,
  subtotal,
  deliveryFee,
  taxes,
  discount: appliedPromo?.discountAmount || 0,
  promoCode: appliedPromo?.code || '',
  total,
  status: 'Placed',
  createdAt: now,
  estimatedDeliveryTime: estimatedDelivery
};
```

---

### Step 6: Fix Secure Order Querying (`src/components/MyOrdersView.tsx`)
In `src/components/MyOrdersView.tsx`, update query logic to filter strictly by `userId`:

```typescript
// Replace lines 80-99 in src/components/MyOrdersView.tsx:
if (user?.uid) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef, 
      where('userId', '==', user.uid),
      limit(20)
    );
    const userSnaps = await getDocs(q);
    userSnaps.forEach(docSnap => {
      if (!seenIds.has(docSnap.id)) {
        seenIds.add(docSnap.id);
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      }
    });
  } catch (err) {
    console.warn('User order query note:', err);
  }
}
```

---

## SECTION 4: POST-REMEDIATION VERIFICATION CHECKLIST

- [ ] **Email/Password Sign-In**: Register a new user in `AuthModal.tsx` and verify the user appears in Firebase Console Authentication table.
- [ ] **Firestore Write Verification**: Place an order in `CheckoutView.tsx` and confirm document is created in `ai-studio-spicetree-.../orders`.
- [ ] **Table Reservation**: Submit a reservation in `ReservationModal.tsx` and confirm document is created in `/reservations`.
- [ ] **Admin Password Check**: Attempt to log in with `tyagiaayush3030@gmail.com` using a wrong password; confirm it is blocked with "Incorrect password".
- [ ] **LocalStorage Tampering Check**: Run `localStorage.setItem('spicetree_admin_session', ...)` in browser console without being logged in with Google/Firebase; verify that the app does NOT grant admin access.
