import { BASE_URL } from "../../config/apiConfig";

const authHeaders = (json = false) => {
    const token = localStorage.getItem("token");
    return {
        accept: "*/*",
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/**
 * Upgrade user from Buyer to Seller
 * Cost: 50 points deducted from wallet (handled by BE)
 * @param {number} userId - User ID
 * @param {Object} payload - { shopName, shopDescription, agreeToTerms }
 * @returns {Promise<Object>} - Updated user data with new role SELLER
 */
export async function upgradeToSellerAPI(userId, payload) {
    if (!userId) {
        throw new Error("User ID is required");
    }

    if (!payload.shopName || !payload.shopName.trim()) {
        throw new Error("Tên shop là bắt buộc");
    }

    if (!payload.shopDescription || !payload.shopDescription.trim()) {
        throw new Error("Mô tả shop là bắt buộc");
    }

    if (payload.shopName.trim().length < 3 || payload.shopName.trim().length > 100) {
        throw new Error("Tên shop phải từ 3 đến 100 ký tự");
    }

    if (payload.shopDescription.trim().length < 20 || payload.shopDescription.trim().length > 500) {
        throw new Error("Mô tả shop phải từ 20 đến 500 ký tự");
    }

    if (!payload.agreeToTerms) {
        throw new Error("Bạn phải đồng ý với điều khoản");
    }

    if (!payload.acceptBusinessResponsibility) {
        throw new Error("Bạn phải cam kết trách nhiệm kinh doanh");
    }

    if ((payload.confirmPhrase || "").trim().toUpperCase() !== "XAC NHAN NANG CAP SELLER") {
        throw new Error("Bạn cần nhập đúng câu xác nhận nâng cấp");
    }

    const res = await fetch(`${BASE_URL}/users/${userId}/upgrade-to-seller`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
            shopName: payload.shopName.trim(),
            shopDescription: payload.shopDescription.trim(),
            agreeToTerms: true,
            acceptBusinessResponsibility: true,
            confirmPhrase: payload.confirmPhrase.trim(),
        }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Nâng cấp thất bại. Vui lòng thử lại.");
    }

    // Return updated user with new SELLER role
    return data.data;
}

export async function getSellerUpgradeFeeAPI() {
    const res = await fetch(`${BASE_URL}/users/upgrade-to-seller-fee`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Không thể tải phí nâng cấp seller.");
    }

    return Number(data?.data?.sellerUpgradeFee ?? 50000);
}