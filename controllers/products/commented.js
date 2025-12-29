// export const getProductsForUsersFromDb = async (req, res) => {
//   try {
//     const { categoryId, productId, color, size, minPrice, maxPrice, sort } =
//       req.query;

//       const {adminId} = req.params
//       // console.log(adminId,'adminId');
      

//     // 🧩 Get platform configuration

//     let platform;

//     if (adminId) {
//       platform = await Platform.findOne({ adminId });
//     }

//     if (!platform) {
//       // fallback to SUPER_ADMIN platform
//       platform = await Platform.findOne({ adminType: "SUPER_ADMIN" });
//     }

//     if (!platform) {
//       return res.status(404).json({ message: "No valid platform found" });
//     }

//     const productsUrl = platform.backendRoutes?.products;
//     if (!productsUrl) {
//       return res
//         .status(400)
//         .json({ message: "No products URL found in backendRoutes" });
//     }

//     // 🧩 Fetch all products from the external source
//     const externalProductsResponse = await axios.get(productsUrl, {
//       withCredentials: true,
//     });
//     const allProducts = externalProductsResponse.data || [];

//     // 🧠 Extract all unique categories (from *all* products, before filtering)
//     const categoryMap = new Map();
//     allProducts.forEach((p) => {
//       const cat = p.categoryId;
//       if (cat && cat._id && !categoryMap.has(cat._id)) {
//         categoryMap.set(cat._id, {
//           _id: cat._id,
//           name: cat.name,
//           slug: cat.slug,
//           banner: cat.banner,
//           categoryIcon: cat.categoryIcon,
//           coverImage: cat.coverImage,
//         });
//       }
//     });
//     const categories = Array.from(categoryMap.values());

//     // 🧩 Apply filters (on a copy of products)
//     let products = [...allProducts];

//     if (categoryId) {
//       products = products.filter(
//         (p) => p.categoryId?._id?.toString() === categoryId
//       );
//     }

//     if (productId) {
//       products = products.filter((p) => p._id?.toString() === productId);
//     }

//     if (color) {
//       const colorArray = color.split(",");
//       products = products.filter((p) =>
//         p.variations?.some((v) =>
//           colorArray.includes(v.colorName.toLowerCase())
//         )
//       );
//     }

//     if (size) {
//       const sizeArray = size.split(",");
//       products = products.filter((p) =>
//         p.variations?.some((v) =>
//           v.sizeArray?.some((s) => sizeArray.includes(s.size))
//         )
//       );
//     }

//     if (minPrice || maxPrice) {
//       products = products.filter(
//         (p) =>
//           p.mrp >= Number(minPrice || 0) && p.mrp <= Number(maxPrice || 999999)
//       );
//     }

//     // 🧩 Sorting logic
//     if (sort === "price_asc") {
//       products.sort((a, b) => a.mrp - b.mrp);
//     } else if (sort === "price_desc") {
//       products.sort((a, b) => b.mrp - a.mrp);
//     } else if (sort === "best_selling") {
//       products.sort((a, b) => b.numberOfReviews - a.numberOfReviews);
//     }

//     const user = req.user; // authenticated user from middleware
//     if (user) {
//       // Get all campaigns for this user
//       const userCampaigns = await Campaign.find({ userId: user._id, status: "ACTIVE" });
//       const campaignProductIds = userCampaigns.map((c) => c.product.productId.toString());

//       // Add campaignProduct flag
//       products = products.map((p) => ({
//         ...p,
//         campaignProduct: campaignProductIds.includes(p._id.toString()),
//       }));
//     } else {
//       // If no user, mark all false
//       products = products.map((p) => ({ ...p, campaignProduct: false }));
//     }

//     // ✅ Final response
//     return res.status(200).json({
//       message: "Products fetched successfully",
//       data: {
//         products,   // filtered products
//         platform,   // platform info
//         categories, // 👈 always includes all categories (not filtered)
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
