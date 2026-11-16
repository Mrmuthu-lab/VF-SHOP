
// VF SHOP - Product Add to Cart

const PRODUCT_API_URL = "http://localhost:8080/api";

document.addEventListener("DOMContentLoaded", async () => {

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

        // Load Products
        const response = await fetch(
            `${PRODUCT_API_URL}/products`
        );

        if (!response.ok) {
            throw new Error("Products loading failed");
        }

        const products = await response.json();

        const productCards = document.querySelectorAll(".prod-muthu");

        productCards.forEach(card => {

            const button = card.querySelector("button");
            const image = card.querySelector("img");
            const name = card.querySelector("h3");

            if (!button || !image || !name) return;

            const productName = name.textContent.trim();
            const imagePath = image.getAttribute("src");

            const dbProduct = products.find(product =>
                product.name === productName &&
                product.image === imagePath
            );

            if (!dbProduct) {
                console.log("Product not found:", productName);
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

                    if (!cartResponse.ok) {

                        if (cartResponse.status === 401 ||
                            cartResponse.status === 403) {
                            throw new Error(
                                "Session expired or access denied. Please login again."
                            );
                        }

                        throw new Error(await cartResponse.text());
                    }

                    const cartData = await cartResponse.json();

                    alert(productName + " added to cart successfully!");

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
