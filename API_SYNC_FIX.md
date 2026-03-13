# 🔧 API Synchronization Fix - Seller Page

## ❌ Vấn đề hiện tại:

### 1. **Bài đăng của tôi** vs **Kiểm định** hiển thị khác nhau
- Cả 2 tabs đều gọi `GET /bikes` và filter ở client
- Không có API riêng cho seller's bikes
- Backend có `GET /orders/my-sales` nhưng đó là orders, không phải bikes

### 2. **API đang dùng sai:**
```javascript
// Hiện tại
GET /bikes?page=0&size=100
// Lấy TẤT CẢ bikes, sau đó filter by sellerId ở frontend
```

### 3. **Dữ liệu không đồng bộ:**
- Tab "Bài đăng" và "Kiểm định" dùng cùng data source
- Nhưng hiển thị khác nhau vì logic filter khác nhau

## ✅ Giải pháp:

### Backend APIs có sẵn:

```
GET /bikes - Tất cả bikes (public)
POST /bikes - Tạo bike mới (SELLER)
PUT /bikes/{id} - Update bike (owner)
DELETE /bikes/{id} - Xóa bike (owner)
GET /bikes/{id} - Chi tiết bike

GET /orders/my-sales - Seller's sales history (ORDERS, not BIKES)
GET /orders/my-purchases - Buyer's purchase history

GET /inspections - List inspections
GET /inspections/{inspectionId} - Inspection detail
POST /inspections - Request inspection
GET /inspections/bikes/{bikeId}/report - Get report by bike ID
```

### Cách fix đúng:

#### Option 1: Dùng GET /bikes và filter ở frontend (HIỆN TẠI)
```javascript
// ✅ Đúng - đang làm như vậy
const bikes = await GET /bikes?page=0&size=100
const sellerBikes = bikes.filter(b => b.sellerId === currentUserId)
```

**Ưu điểm:**
- Không cần thêm API mới
- Frontend control filter logic

**Nhược điểm:**
- Load nhiều data không cần thiết
- Performance kém khi có nhiều bikes

#### Option 2: Backend thêm API mới (KHUYẾN NGHỊ)
```java
// Backend cần thêm
GET /bikes/my-bikes - Lấy bikes của seller hiện tại
GET /bikes/seller/{sellerId} - Lấy bikes của seller cụ thể
```

### Về Inspections:

Backend ĐÃ CÓ đầy đủ APIs:
```
GET /inspections?bike_id={bikeId} - Filter by bike
GET /inspections/bikes/{bikeId}/report - Get report
POST /inspections - Request inspection
```

## 🔍 Root Cause Analysis:

### Tại sao 2 tabs hiển thị khác nhau?

**Tab "Bài đăng của tôi":**
```typescript
// Hiển thị TẤT CẢ bikes của seller
bikes.map(bike => ...)
```

**Tab "Kiểm định":**
```typescript
// Filter theo inspectionStatus
const filteredBikes = bikes.filter(bike => {
  if (filter === "approved") return bike.inspectionStatus === "APPROVED"
  if (filter === "pending") return bike.inspectionStatus === "REQUESTED"
  return true // all
})
```

→ **Cùng data source nhưng filter khác nhau!**

## 🛠️ Fix Implementation:

### 1. Sửa refreshBikes() để đảm bảo consistency:

```typescript
const refreshBikes = async () => {
  try {
    setBikesLoading(true);
    setBikesError(null);
    
    // Gọi API
    const response = await listSellerBikesAPI({ page: 0, size: 100 }, token);
    
    // Parse response
    const content = response?.data || response?.content || response || [];
    
    // Filter chỉ lấy bikes của seller hiện tại
    const userId = user?.id;
    const sellerBikes = content
      .filter(b => b.sellerId === userId)
      .map(b => ({
        id: b.id,
        title: b.title,
        pricePoints: b.pricePoints,
        condition: b.condition,
        status: b.status,
        inspectionStatus: b.inspectionStatus,
        media: b.media || [],
        sellerId: b.sellerId,
      }));
    
    console.log(`✅ Loaded ${sellerBikes.length} bikes for seller #${userId}`);
    setBikes(sellerBikes);
  } catch (e) {
    console.error("❌ Error:", e);
    setBikesError(e.message);
  } finally {
    setBikesLoading(false);
  }
};
```

### 2. Đảm bảo cả 2 tabs dùng CÙNG data:

```typescript
// Tab "Bài đăng"
<PostsTab bikes={bikes} ... />

// Tab "Kiểm định"  
<InspectionTab bikes={bikes} ... />
```

→ **Cùng data source = đồng bộ!**

### 3. Fix inspection API calls:

```typescript
// Đúng
const openInspectionForBike = async (bikeId) => {
  // Step 1: Get inspection list for this bike
  const inspections = await GET /inspections?bike_id={bikeId}
  
  // Step 2: Get inspection detail
  const inspectionId = inspections[0].id
  const detail = await GET /inspections/{inspectionId}
  
  // Step 3: Get report (if approved)
  const report = await GET /inspections/bikes/{bikeId}/report
}
```

## 📋 Checklist Fix:

- [ ] Verify `GET /bikes` returns correct data structure
- [ ] Ensure `sellerId` field exists in response
- [ ] Ensure `inspectionStatus` field exists in response
- [ ] Both tabs use same `bikes` state
- [ ] Filter logic is consistent
- [ ] Console logs show correct data
- [ ] No duplicate API calls
- [ ] Refresh button works on both tabs

## 🧪 Test Steps:

1. **Login as seller1@bikeexchange.com**
2. **Open DevTools Console**
3. **Go to "Bài đăng của tôi"**
   - Check console: "✅ Loaded X bikes"
   - Verify bikes displayed
4. **Go to "Kiểm định"**
   - Should show SAME bikes
   - Filter "Tất cả" = all bikes
   - Filter "Đã kiểm định" = only APPROVED
   - Filter "Đang kiểm định" = only REQUESTED/IN_PROGRESS
5. **Click "Làm mới"**
   - Should reload data
   - Console shows new API call

## 🎯 Expected Result:

```
Tab "Bài đăng": 5 bikes
Tab "Kiểm định" → "Tất cả": 5 bikes (SAME)
Tab "Kiểm định" → "Đã kiểm định": 1 bike (filtered)
Tab "Kiểm định" → "Đang kiểm định": 1 bike (filtered)
```

## 💡 Recommendation:

**Short-term (Hiện tại):**
- ✅ Dùng `GET /bikes` và filter ở frontend
- ✅ Đảm bảo cả 2 tabs dùng cùng state
- ✅ Fix filter logic để consistent

**Long-term (Tương lai):**
- 🔄 Backend thêm `GET /bikes/my-bikes`
- 🔄 Pagination đúng cách
- 🔄 Server-side filtering
