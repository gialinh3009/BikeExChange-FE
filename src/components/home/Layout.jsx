import React, { useState, useEffect } from "react";
import Header from "./Header";
import Banner from "./Banner";
import ListProduct from "./ListProduct";
import Footer from "./Footer";

export default function GuestLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Banner />
                <ListProduct />
            </main>
            <Footer />
        </div>
    );
}