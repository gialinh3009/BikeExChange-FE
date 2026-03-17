# BikeExChange FE - Flow Implementation Status

## ✅ Flow 3 - Đặt mua / Hoàn tất giao dịch & Đánh giá (Purchase & Transaction Completion & Rating)

### Buyer Side - OrderDetailPage.tsx

#### 1. **ESCROWED Status** (Đơn hàng đã được tạo)
- ✅ Cancel button: "Hủy đơn hàng"
  - API: `POST /orders/{id}/cancel`
  - Allows buyer to cancel before seller accepts

#### 2. **ACCEPTED Status** (Seller đã xác nhận)
- Status display only
- Waiting for seller to mark as delivered

#### 3. **DELIVERED Status** (Đang giao hàng) ✅
- ✅ Confirm Receipt button: "Xác nhận đã nhận hàng"
  - API: `POST /orders/{id}/confirm-receipt`
  - Auto-complete info: `daysUntilAutoRelease` (auto-confirm after X days)
  - This moves order to COMPLETED status
  
- ✅ Request Return button: "Yêu cầu hoàn hàng"
  - API: `POST /orders/{id}/request-return`
  - Opens RequestReturnModal to provide reason
  - Available within 14 days

#### 4. **COMPLETED Status** (Hoàn thành) ✅
- ✅ Review/Rating button: "Đánh giá giao dịch"
  - Navigation to `/orders/{id}/review`
  - Only shows if `canReview = true` AND not yet reviewed

### Seller Side - SellerOrderDetailPage.tsx

#### 1. **ESCROWED Status** (Chờ xác nhận)
- ✅ Accept Order button: "✓ Xác nhận nhận đơn"
  - API: `POST /orders/{id}/accept`
  - Moves to ACCEPTED status

#### 2. **ACCEPTED Status** (Đã xác nhận) ✅
- ✅ **DELIVERY FORM** with inline inputs:
  - Shipping Carrier input (VD: GHN, GHTK)
  - Tracking Code input (mã vận đơn)
  - Shipping Note input (optional)
  
- ✅ **DELIVER BUTTON**: "🚚 Đánh dấu đã giao"
  - API: `POST /orders/{id}/deliver`
  - Component: `OrderDeliveryForm.tsx` (modal alternative available)
  - Shipping carriers: GHN, GHTK, VTP, J&T Express, Other
  - Moves order to DELIVERED status

#### 3. **DELIVERED Status** (Đã giao hàng)
- Status display only
- Waiting for buyer to confirm receipt

#### 4. **COMPLETED Status** (Hoàn thành)
- Order complete, transaction finished

---

## ✅ Flow 4 - Hoàn tiền / Trả hàng Khiếu nại (Return & Refund / Dispute)

### Buyer Side - Return Flow

#### 1. **From DELIVERED → Request Return**
- ✅ Button: "Yêu cầu hoàn hàng"
- ✅ Modal: `RequestReturnModal.tsx`
  - User provides return reason (textarea)
  - API: `POST /orders/{id}/request-return`
  - Moves to RETURN_REQUESTED status

#### 2. **RETURN_REQUESTED Status** (Yêu cầu hoàn hàng)
- ✅ Open Dispute button: "Mở tranh chấp với Admin"
  - API: `POST /orders/{orderId}/return-dispute`
  - If seller doesn't accept within time
  - Moves to DISPUTED status

### Seller Side - Return Confirmation

#### 1. **RETURN_REQUESTED Status**
- ✅ Confirm Return button: "✓ Xác nhận đã nhận lại hàng"
  - API: `POST /orders/{id}/confirm-return`
  - Moves to REFUNDED status

#### 2. **REFUNDED Status**
- Order complete, refund processed

---

## 📦 Delivery Button Status

### ✅ YES - Delivery button EXISTS in FE

**Location:** `src/components/Seller/SellerOrderDetailPage.tsx`

**Implementation:**
1. **Inline Form** (Primary method):
   - When order status = "ACCEPTED"
   - Three input fields appear inline:
     - Shipping Carrier (text input)
     - Tracking Code (text input)
     - Shipping Note (optional text input)
   - Green button: "🚚 Đánh dấu đã giao"
   - Calls: `handleDeliver()` → `POST /orders/{id}/deliver`

2. **Modal Form** (Alternative):
   - Component: `OrderDeliveryForm.tsx`
   - More polished UI with dropdown for carriers
   - Carriers: GHN, GHTK, VTP, J&T Express, Other
   - Can be triggered separately if needed

---

## API Integration Summary

### Buyer Order Actions
- `cancelOrderAPI(orderId, token)` - Cancel order
- `confirmReceiptAPI(orderId, token)` - Confirm received goods
- `requestReturnAPI(orderId, reason, token)` - Request return
- `openReturnDisputeAPI(orderId, token)` - Open dispute

### Seller Order Actions
- `acceptOrderAPI(orderId, token)` - Accept order
- `deliverOrderAPI(orderId, deliveryData, token)` - Mark as delivered
- `confirmReturnAPI(orderId, token)` - Confirm received return

### Service Files
- `src/services/orderService.js` - Main order APIs
- `src/services/Buyer/orderActionService.js` - Buyer-specific actions
- API endpoints in `src/config/apiConfig.js`

---

## Status Flow Diagram

```
BUYER                           SELLER
┌──────────────┐          ┌──────────────┐
│   CREATE     │          │              │
│  (ESCROWED)  │──────→   │  (ESCROWED)  │
└──────────────┘          └──────────────┘
      │                          │
      │ [Cancel]       [Accept] │
      │                          ↓
      │                    ┌──────────────┐
      │                    │  (ACCEPTED)  │
      │                    │ 🚚 Deliver   │
      │                    └──────────────┘
      │                          │
      │                [Deliver]│
      ↓                          ↓
┌──────────────┐          ┌──────────────┐
│ (DELIVERED)  │←─────────│ (DELIVERED)  │
│ ✓ Confirm    │          └──────────────┘
│ ↻ Request    │
│   Return     │
└──────────────┘
      │
      ├─→ [Confirm Receipt] ──→ (COMPLETED) ✅
      │
      └─→ [Request Return]
            │
            ↓
      ┌──────────────┐
      │(RETURN_REQ)  │
      │ ⚠ Dispute    │
      └──────────────┘
            │
            ├─→ [Confirm Return] (Seller) ──→ (REFUNDED)
            │
            └─→ [Open Dispute] ──→ (DISPUTED) → Admin Resolution
```

---

## Checklist Summary

- ✅ **Flow 3 Complete:**
  - ✅ Purchase order creation & acceptance
  - ✅ Shipping delivery marking
  - ✅ Receipt confirmation
  - ✅ Transaction completion
  - ✅ Rating/Review functionality

- ✅ **Flow 4 Complete:**
  - ✅ Return request from buyer
  - ✅ Return confirmation from seller
  - ✅ Dispute escalation
  - ✅ Refund status handling

- ✅ **Delivery Button:** Present and functional
  - Inline form in SellerOrderDetailPage
  - Modal component available
  - Supports multiple shipping carriers

---

**Last Updated:** March 17, 2026
**Status:** ✅ All flows implemented
