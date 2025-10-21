import { Campaign } from "../../models/campaignSchema.js";
import { Platform } from "../../models/platformSchema.js";
import { Product } from "../../models/productSchema.js";
import axios from "axios";
/**
 * @desc Get all products (optionally filtered by domain/status)
 * @route GET /api/products
 */
export const getProductsFromDb = async (req, res) => {
  try {
    const { domain, status } = req.query;
    const filter = {};
    if (domain) filter.domain = domain;
    if (status) filter.status = status;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

/**
 * @desc Add or update multiple products
 * @route POST /api/products
 */
export const updateProductsToDb = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No products provided" });
    }

    // <-------- for without check single updates only ------->
    // for (const prod of products) {
    //   const { productId, domain, ...fields } = prod;
    //   if (!productId || !domain) continue;

    //   await Product.findOneAndUpdate(
    //     { productId, domain },
    //     { $set: fields },
    //     { upsert: true, new: true }
    //   );
    // }
    // <-------- for without check single updates only ------->

    for (const prod of products) {
      const { productId, domain, ...fields } = prod;

      if (productId && domain) {
        // update specific product
        await Product.findOneAndUpdate(
          { productId, domain },
          { $set: fields },
          { upsert: true, new: true }
        );
      } else {
        // update all products
        await Product.updateMany({}, { $set: fields });
      }
    }

    return res.json({
      success: true,
      message: "Products updated successfully",
    });
  } catch (error) {
    console.error("Error updating products:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating products",
      error: error.message,
    });
  }
};

/**
 * @desc Update a single product’s commission
 * @route PATCH /api/products/:id
 */
export const updateProductCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission } = req.body;

    if (commission === undefined)
      return res
        .status(400)
        .json({ success: false, message: "Commission value required" });

    const product = await Product.findByIdAndUpdate(
      id,
      { commission },
      { new: true }
    );

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    return res.json({
      success: true,
      message: "Commission updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating commission:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating commission",
      error: error.message,
    });
  }
};

/**
 * @desc Update a single product’s status
 * @route PATCH /api/products/:id/status
 */

export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    // Validate status if provided
    if (status && !["ACTIVE", "PAUSED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status value required (ACTIVE or PAUSED)",
      });
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Active must be a boolean value",
      });
    }

    // Build update object dynamically
    const updateFields = {};
    if (status) updateFields.status = status;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const product = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      message: `Product updated successfully`,
      data: product,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating product status",
      error: error.message,
    });
  }
};

// =========================== get product for user with product route and schema ===========================
/**
 * @desc Get all products (optionally filtered by domain/status)
 * @route GET /api/products
 */
// export const getProductsForUsersFromDb = async (req, res) => {
//     try {
//       const platform = await Platform.findOne({});
//       if (!platform) {
//         return res.status(404).json({ message: "Platform not found" });
//       }

//       const productsUrl = platform.backendRoutes?.products;
//       if (!productsUrl) {
//         return res
//           .status(400)
//           .json({ message: "No products URL found in backendRoutes" });
//       }

//       // Fetch external products
//       const externalProductsResponse = await axios.get(productsUrl, {
//         withCredentials: true,
//       });
//       const externalProducts = externalProductsResponse.data || [];

//       // Fetch all local products (active or inactive)
//       const localProducts = await Product.find({ domain: platform.domain });

//       // Map local products by productId for quick lookup
//       const localProductsMap = new Map(
//         localProducts.map((p) => [p.productId.toString(), p])
//       );

//       // Merge local product data into external products (local has priority)
//       let mergedProducts = externalProducts
//         .map((p) => {
//           const local = localProductsMap.get(p._id.toString());
//           if (local) {
//             if (!local.isActive) return null; // skip inactive local products
//             return { ...p, ...local.toObject() }; // merge active local
//           }
//           return p; // no local product
//         })
//         .filter(Boolean);

//       // Include local products not in external products
//       const externalIds = new Set(externalProducts.map((p) => p._id.toString()));
//       const additionalLocalProducts = localProducts
//         .filter((p) => p.isActive && !externalIds.has(p.productId.toString()))
//         .map((p) => p.toObject());

//       mergedProducts = [...mergedProducts, ...additionalLocalProducts];

//       // -------------------
//       // Parse query filters
//       const { productId, color, size, minPrice, maxPrice } = req.query;

//       if (productId) {
//         mergedProducts = mergedProducts.filter(
//           (p) => p._id.toString() === productId.toString()
//         );
//       }

//       if (color) {
//         const colors = typeof color === "string" ? color.split(",") : color;
//         mergedProducts = mergedProducts.filter(
//           (p) => p.color && colors.includes(p.color)
//         );
//       }

//       if (size) {
//         const sizes = typeof size === "string" ? size.split(",") : size;
//         mergedProducts = mergedProducts.filter(
//           (p) => p.size && sizes.includes(p.size)
//         );
//       }

//       if (minPrice || maxPrice) {
//         const min = minPrice !== undefined ? Number(minPrice) : 0;
//         const max = maxPrice !== undefined ? Number(maxPrice) : Infinity;
//         mergedProducts = mergedProducts.filter(
//           (p) => p.price >= min && p.price <= max
//         );
//       }

//       // Return all if no filters applied
//       return res.status(200).json({
//         platform: {
//           domain: platform.domain,
//           commission: platform.commission,
//           paymentMethods: platform.paymentMethods,
//           bankTransfer: platform.bankTransfer,
//           onlineTransfer: platform.onlineTransfer,
//           tdsLinkedMethods: platform.tdsLinkedMethods,
//           tdsUnLinkedMethods: platform.tdsUnLinkedMethods,
//           termAndConditions: platform.termAndConditions,
//         },
//         products: mergedProducts,
//       });
//     } catch (error) {
//       console.error("Error fetching products for users:", error);
//       return res
//         .status(500)
//         .json({ message: "Internal server error", error: error.message });
//     }
//   };

// export const getProductsForUsersFromDb = async (req, res) => {
//     try {

//       let filter = { isActive: true,  };

//       Object.keys(req.query).forEach((key) => {
//         let value = req.query[key];

//         if (value === "true") value = true;
//         if (value === "false") value = false;

//         if (!["isActive"].includes(key)) {
//           filter[key] = value;
//         }
//       });

//       const platform = await Platform.findOne({});
//       if (!platform) {
//         return res.status(404).json({ message: "Platform not found" });
//       }

//       const productsUrl = platform.backendRoutes?.products;
//       if (!productsUrl) {
//         return res.status(400).json({ message: "No products URL found in backendRoutes" });
//       }

//       const externalProductsResponse = await axios.get(productsUrl, { withCredentials: true });
//       const externalProducts = externalProductsResponse.data || [];

//       // Fetch all local products (active or inactive)
//       const localProducts = await Product.find({ domain: platform.domain });

//       // Map local products by productId for quick lookup
//       const localProductsMap = new Map(
//         localProducts.map(p => [p.productId.toString(), p])
//       );

//       // Merge local product data into external products if active
//       const finalProducts = externalProducts
//         .map(p => {
//           const local = localProductsMap.get(p._id.toString());
//           if (local) {
//             // If local is inactive, skip this product
//             if (!local.isActive) return null;

//             // Merge local data into external product (external product remains as base)
//             return { ...p, ...local.toObject() };
//           }
//           return p; // no local product, keep external as is
//         })
//         .filter(Boolean); // remove nulls

//       return res.status(200).json({
//         platform: {
//           domain: platform.domain,
//           commission: platform.commission,
//           paymentMethods: platform.paymentMethods,
//           bankTransfer: platform.bankTransfer,
//           onlineTransfer: platform.onlineTransfer,
//           tdsLinkedMethods: platform.tdsLinkedMethods,
//           tdsUnLinkedMethods: platform.tdsUnLinkedMethods,
//           termAndConditions: platform.termAndConditions,
//         },
//         products: finalProducts,
//       });
//     } catch (error) {
//       console.error("Error fetching products for users:", error);
//       return res.status(500).json({ message: "Internal server error", error: error.message });
//     }
//   };
// export const getProductsForUsersFromDb = async (req, res) => {
//   try {
//     const { categoryId, productId, color, size, minPrice, maxPrice, sort } =
//       req.query;

//     const platform = await Platform.findOne({});
//     if (!platform) {
//       return res.status(404).json({ message: "Platform not found" });
//     }

//     const productsUrl = platform.backendRoutes?.products;
//     if (!productsUrl) {
//       return res
//         .status(400)
//         .json({ message: "No products URL found in backendRoutes" });
//     }

//     const externalProductsResponse = await axios.get(productsUrl, {
//       withCredentials: true,
//     });
//     let products = externalProductsResponse.data || [];

//     // ✅ Filter locally
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

//     // ✅ Sorting
//     if (sort === "price_asc") {
//       products.sort((a, b) => a.mrp - b.mrp);
//     } else if (sort === "price_desc") {
//       products.sort((a, b) => b.mrp - a.mrp);
//     } else if (sort === "best_selling") {
//       products.sort((a, b) => b.numberOfReviews - a.numberOfReviews);
//     }

//     // ✅ Extract unique categories
//     const categoryMap = new Map();
//     products.forEach((p) => {
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

//     return res.status(200).json({
//       message: "Products fetched successfully",
//       data: { products, platform, categories },
//     });
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal Server Error", error: error.message });
//   }
// };

export const getProductsForUsersFromDb = async (req, res) => {
  try {
    const { categoryId, productId, color, size, minPrice, maxPrice, sort } =
      req.query;

    // 🧩 Get platform configuration
    const platform = await Platform.findOne({});
    if (!platform) {
      return res.status(404).json({ message: "Platform not found" });
    }

    const productsUrl = platform.backendRoutes?.products;
    if (!productsUrl) {
      return res
        .status(400)
        .json({ message: "No products URL found in backendRoutes" });
    }

    // 🧩 Fetch all products from the external source
    const externalProductsResponse = await axios.get(productsUrl, {
      withCredentials: true,
    });
    const allProducts = externalProductsResponse.data || [];

    // 🧠 Extract all unique categories (from *all* products, before filtering)
    const categoryMap = new Map();
    allProducts.forEach((p) => {
      const cat = p.categoryId;
      if (cat && cat._id && !categoryMap.has(cat._id)) {
        categoryMap.set(cat._id, {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          banner: cat.banner,
          categoryIcon: cat.categoryIcon,
          coverImage: cat.coverImage,
        });
      }
    });
    const categories = Array.from(categoryMap.values());

    // 🧩 Apply filters (on a copy of products)
    let products = [...allProducts];

    if (categoryId) {
      products = products.filter(
        (p) => p.categoryId?._id?.toString() === categoryId
      );
    }

    if (productId) {
      products = products.filter((p) => p._id?.toString() === productId);
    }

    if (color) {
      const colorArray = color.split(",");
      products = products.filter((p) =>
        p.variations?.some((v) =>
          colorArray.includes(v.colorName.toLowerCase())
        )
      );
    }

    if (size) {
      const sizeArray = size.split(",");
      products = products.filter((p) =>
        p.variations?.some((v) =>
          v.sizeArray?.some((s) => sizeArray.includes(s.size))
        )
      );
    }

    if (minPrice || maxPrice) {
      products = products.filter(
        (p) =>
          p.mrp >= Number(minPrice || 0) && p.mrp <= Number(maxPrice || 999999)
      );
    }

    // 🧩 Sorting logic
    if (sort === "price_asc") {
      products.sort((a, b) => a.mrp - b.mrp);
    } else if (sort === "price_desc") {
      products.sort((a, b) => b.mrp - a.mrp);
    } else if (sort === "best_selling") {
      products.sort((a, b) => b.numberOfReviews - a.numberOfReviews);
    }

    const user = req.user; // authenticated user from middleware
    if (user) {
      // Get all campaigns for this user
      const userCampaigns = await Campaign.find({ userId: user._id, status: "ACTIVE" });
      const campaignProductIds = userCampaigns.map((c) => c.product.productId.toString());

      // Add campaignProduct flag
      products = products.map((p) => ({
        ...p,
        campaignProduct: campaignProductIds.includes(p._id.toString()),
      }));
    } else {
      // If no user, mark all false
      products = products.map((p) => ({ ...p, campaignProduct: false }));
    }

    // ✅ Final response
    return res.status(200).json({
      message: "Products fetched successfully",
      data: {
        products,   // filtered products
        platform,   // platform info
        categories, // 👈 always includes all categories (not filtered)
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
