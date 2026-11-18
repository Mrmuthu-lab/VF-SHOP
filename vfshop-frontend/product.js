
// VF SHOP - Product Add to Cart

const PRODUCT_API_URL = "https://vfshop-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {

    // Get logged-in user
    const user = JSON.parse(
        localStorage.getItem("vfshopUser") || "null"
    );

    const token = localStorage.getItem("token");

    if (!user || !user.id || !token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    try {

        // Fetch products from backend
        const response = await fetch(
            `${PRODUCT_API_URL}/products`
        );

        if (!response.ok) {
            throw new Error(
                `Products loading failed: ${response.status}`
            );
        }

        const products = await response.json();

        console.log("Backend Products:", products);

        const productCards = document.querySelectorAll(".prod-muthu");

        productCards.forEach(card => {

            const button = card.querySelector("button");
            const image = card.querySelector("img");
            const name = card.querySelector("h3");

            if (!button || !image || !name) return;

            const productName = name.textContent.trim();
            const imagePath = image.getAttribute("src");

            // Match frontend product with database product
            const dbProduct = products.find(product =>
                product.name?.trim() === productName &&
                product.image?.trim() === imagePath
            );

            if (!dbProduct) {
                console.log("Product not found:", productName, imagePath);
                return;
            }

            // Add to Cart
            button.addEventListener("click", async () => {

                button.disabled = true;

                try {

                    const cartResponse = await fetch(
                        `${PRODUCT_API_URL}/cart/add`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                userId: user.id,
                                productId: dbProduct.id,
                                quantity: 1
                            })
                        }
                    );

                    // Read response safely
                    const responseText = await cartResponse.text();

                    if (!cartResponse.ok) {

                        if (
                            cartResponse.status === 401 ||
                            cartResponse.status === 403
                        ) {
                            throw new Error(
                                "Session expired or access denied. Please login again."
                            );
                        }

                        throw new Error(
                            responseText || `Server Error: ${cartResponse.status}`
                        );
                    }

                    // Handle empty response
                    let cartData = null;

                    if (responseText.trim()) {
                        try {
                            cartData = JSON.parse(responseText);
                        } catch {
                            cartData = responseText;
                        }
                    }

                    alert(
                        productName + " added to cart successfully!"
                    );

                    console.log("Cart Updated:", cartData);

                } catch (error) {

                    console.error("Cart Error:", error);

                    alert("Cart Error: " + error.message);

                } finally {

                    button.disabled = false;

                }
            });

        });

        console.log("Products connected successfully!");

    } catch (error) {

        console.error("Product loading error:", error);

    }

});
