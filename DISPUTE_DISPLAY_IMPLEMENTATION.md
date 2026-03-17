# BikeExChange FE - Dispute Display Implementation

## ✅ Các tính năng đã thêm

### 1. **API Service Updates** (`src/services/disputeService.js`)
- ✅ `getMyDisputesAPI(token)` - Lấy danh sách tranh chấp của user
  - Endpoint: `GET /api/orders/my-disputes`
  
- ✅ `getDisputeDetailAPI(orderId, token)` - Lấy chi tiết tranh chấp
  - Endpoint: `GET /api/orders/{orderId}/history`

### 2. **DisputeDetailPage.tsx** 
- **Route:** `/orders/:id/dispute`
- **Features:**
  - Hiển thị thông tin đơn hàng chi tiết
  - Hiển thị lý do khiếu nại
  - Hiển thị quyết định xử lý từ Admin (REFUND / KEPT)
  - Hiển thị ghi chú từ Admin
  - Timeline lịch sử giao dịch
  - Status: DISPUTED (đang xử lý) hoặc RESOLVED (đã giải quyết)
  - Nút "Làm mới" để reload dữ liệu
  - Back button để quay lại

### 3. **DisputesTab.tsx**
- **Component:** Tab hiển thị danh sách tranh chấp
- **Features:**
  - Danh sách tất cả tranh chấp của Buyer/Seller
  - Hiển thị:
    - ID đơn hàng
    - Tên xe đạp
    - Tên buyer & seller
    - Giá trị đơn hàng
    - Lý do khiếu nại (preview)
    - Ngày khiếu nại
    - Trạng thái (Đang xử lý / Đã giải quyết)
  - Nếu đã giải quyết, hiển thị:
    - Quyết định (Hoàn tiền / Giữ lại)
    - Ngày xử lý
  - Button "Xem chi tiết" → Navigate tới DisputeDetailPage
  - Trang trắng nếu không có tranh chấp
  - Nút "Làm mới" để reload danh sách

### 4. **Routes Update** (`src/Routes/AppRoutes.tsx`)
```tsx
<Route path="/orders/:id/dispute" element={<DisputeDetailPage />} />
```
- Available for BUYER & SELLER roles

---

## 📊 UI Features

### DisputeDetailPage
```
┌─────────────────────────────┐
│ ← Back | Tranh chấp #123    │ ← Top bar
├─────────────────────────────┤
│                             │
│  🚨 Trạng thái tranh chấp   │ ← Hero (đang tranh chấp)
│  Đang tranh chấp            │
│  Admin đang xử lý...        │
│                             │
├─────────────────────────────┤
│ Thông tin đơn hàng          │ ← Order info
│ ├ Xe đạp: [Title]           │
│ ├ Người mua: [Name]         │
│ ├ Người bán: [Name]         │
│ ├ Giá trị: [Amount]         │
│ └ Ngày tạo: [Date]          │
├─────────────────────────────┤
│ Chi tiết tranh chấp         │ ← Dispute details
│ ├ Lý do: [Reason]           │
│ ├ Quyết định: ✓ Hoàn tiền   │ ← If resolved
│ ├ Ghi chú: [Admin note]     │
│ └ Ngày xử lý: [Date]        │
├─────────────────────────────┤
│ Lịch sử đơn hàng            │ ← Timeline
│ [Timeline events]           │
└─────────────────────────────┘
```

### DisputesTab
```
┌────────────────────────────────────┐
│ Danh sách tranh chấp (5)  [Làm mới] │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 🚨 Đơn #123  [Đang xử lý]      │ │
│ │ Tên xe đạp                      │ │
│ │ Mua: [Name] | Bán: [Name]      │ │
│ │                                │ │
│ │ Lý do:                          │ │
│ │ Xe bị trầy xước, không giống... │ │
│ │                                │ │
│ │ Giá trị: 5,000,000 đ            │ │
│ │ Ngày khiếu nại: 17/03/2026      │ │
│ │                                │ │
│ │ ✓ Quyết định: Hoàn tiền cho... │ │
│ │   Ngày xử lý: 18/03/2026        │ │
│ │                                │ │
│ │         [👁 Xem chi tiết]       │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ ✓ Đơn #122  [Đã giải quyết]    │ │
│ │ ...                            │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## 🔗 Integration Points

### Existing OrderDetailPage Connection
Khi order status = "DISPUTED", người dùng sẽ:
1. Thấy button "Mở tranh chấp với Admin" bị disable (vì đã mở)
2. Có thể navigate tới `/orders/{id}/dispute` để xem chi tiết tranh chấp

### Flow Integration
```
RETURN_REQUESTED status
       ↓
User clicks "Mở tranh chấp với Admin"
       ↓
Order → DISPUTED
       ↓
User can view:
  - DisputesTab (list)
  - DisputeDetailPage (detail)
```

---

## 📝 Code Structure

### New Files
- `src/components/Buyer/DisputeDetailPage.tsx` (395 lines)
- `src/components/Buyer/DisputesTab.tsx` (290 lines)

### Modified Files
- `src/services/disputeService.js` - Added 2 new API functions
- `src/Routes/AppRoutes.tsx` - Added 1 new route

---

## 🎨 Styling Notes
- Uses consistent DM Sans font family
- Color scheme:
  - **Error/Warning:** #ef4444 (red)
  - **Success:** #10b981 (green)
  - **Primary:** #2563eb (blue)
  - **Info/Pending:** #f59e0b (yellow)
- Responsive design with flexbox
- Smooth animations & transitions

---

## ✅ Status
- ✅ Dispute detail page implemented
- ✅ Disputes list tab implemented
- ✅ API service methods added
- ✅ Routes configured
- ✅ UI/UX designed
- ✅ Linting issues fixed

**Ready to use!**

---

**Last Updated:** March 17, 2026
**Status:** ✅ Complete
