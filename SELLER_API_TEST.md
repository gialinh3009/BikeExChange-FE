# 🧪 Seller API Testing Guide

## ✅ Đã sửa:

1. **Unified data parsing** - Parse response đồng nhất
2. **Better logging** - Console logs chi tiết hơn
3. **Inspection status breakdown** - Hiển thị số lượng theo từng status
4. **Consistent filtering** - Cả 2 tabs dùng cùng logic

## 🔍 Test Steps:

### 1. Mở DevTools Console
```
F12 → Console tab
```

### 2. Đăng nhập
```
Email: seller1@bikeexchange.com
Password: password123
```

### 3. Xem Console Logs

Bạn sẽ thấy:
```
🚲 API Response: { success: true, data: [...] }
📦 Parsed content: [...]
✅ Filtered 4 bikes for seller #2
📊 Bikes by inspection status: {
  total: 4,
  approved: 1,
  pending: 0,
  none: 3
}
```

### 4. Verify Tab "Bài đăng của tôi"

**Expected:**
- Hiển thị 4 bikes
- Mỗi bike có: title, condition, pricePoints, status
- Badge "Đã kiểm định" cho bikes có inspectionStatus = "APPROVED"
- Badge "Đang chờ kiểm định" cho bikes có inspectionStatus = "REQUESTED"

### 5. Verify Tab "Kiểm định"

**Sub-tab "Tất cả":**
- Hiển thị 4 bikes (SAME as "Bài đăng")
- Có ảnh thumbnail
- Có status badge

**Sub-tab "Đã kiểm định":**
- Hiển thị 1 bike (inspectionStatus = "APPROVED")
- Badge màu xanh "Đã kiểm định"
- Nút "Xem báo cáo"

**Sub-tab "Đang kiểm định":**
- Hiển thị 0 hoặc 1 bike (inspectionStatus = "REQUESTED/IN_PROGRESS")
- Badge màu vàng
- Nút "Xem trạng thái"

### 6. Click "Làm mới"

- Console log lại
- Data refresh
- UI update

## 📊 Expected Data Structure:

### API Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Trek Émonda SL 6 2022",
      "pricePoints": 45000,
      "condition": "EXCELLENT",
      "status": "ACTIVE",
      "inspectionStatus": "NONE",
      "sellerId": 2,
      "media": [
        {
          "url": "https://...",
          "type": "IMAGE",
          "sortOrder": 0
        }
      ]
    }
  ]
}
```

### Frontend State:
```typescript
bikes: [
  {
    id: 1,
    title: "Trek Émonda SL 6 2022",
    pricePoints: 45000,
    condition: "EXCELLENT",
    status: "ACTIVE",
    inspectionStatus: "NONE",
    media: [...],
    sellerId: 2
  }
]
```

## 🐛 Common Issues:

### Issue 1: "Filtered 0 bikes"
**Cause:** sellerId không khớp
**Fix:** 
- Check `user.id` trong localStorage
- Check `sellerId` trong API response
- Verify filter logic

### Issue 2: inspectionStatus luôn là "NONE"
**Cause:** Backend không trả về field này
**Fix:**
- Check API response structure
- Verify backend BikeResponse DTO
- Check database data

### Issue 3: 2 tabs hiển thị khác nhau
**Cause:** Filter logic khác nhau
**Fix:**
- Verify cả 2 tabs dùng cùng `bikes` state
- Check filter conditions
- Console log filtered results

## 🔧 Debug Commands:

### In Browser Console:

```javascript
// Check current user
JSON.parse(localStorage.getItem('user'))

// Check token
localStorage.getItem('token')

// Check bikes state (if exposed)
// (You need to add window.debugBikes = bikes in code)
```

### In Code (temporary):

```typescript
// Add to refreshBikes()
console.table(sellerBikes.map(b => ({
  id: b.id,
  title: b.title,
  status: b.status,
  inspectionStatus: b.inspectionStatus,
})));
```

## ✅ Success Criteria:

- [ ] Console shows correct number of bikes
- [ ] Tab "Bài đăng" shows all seller's bikes
- [ ] Tab "Kiểm định" → "Tất cả" shows SAME bikes
- [ ] Tab "Kiểm định" → "Đã kiểm định" shows only APPROVED
- [ ] Tab "Kiểm định" → "Đang kiểm định" shows only PENDING
- [ ] Badges display correctly
- [ ] Images load correctly
- [ ] "Làm mới" button works
- [ ] No console errors
- [ ] No TypeScript errors

## 🎯 Next Steps:

If data is still inconsistent:

1. **Check Backend Response:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://bikeexchange-be.onrender.com/api/bikes
   ```

2. **Verify sellerId:**
   - Login as seller1
   - Check user.id in localStorage
   - Verify bikes in response have matching sellerId

3. **Check Database:**
   - Verify seller1 actually has bikes
   - Check inspectionStatus values in DB

4. **Test with different sellers:**
   - seller2@bikeexchange.com
   - seller3@bikeexchange.com
