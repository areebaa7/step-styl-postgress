# 👠 Step & Styl — Luxury Footwear E-Commerce Platform

A production-ready, full-stack luxury footwear e-commerce web platform engineered with a sleek purple-themed aesthetic, dynamic multi-attribute product variants, secure checkout workflows, real-time global search, a customer wishlist system, and a comprehensive administrative management portal.

---

## 🚀 Live Demo & Production
* **Live Website:** [www.stepandstyl.com](https://www.stepandstyl.com) *(Hosted via Vercel & Managed on Hostinger)*

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
* **Backend:** Next.js API Routes, Node.js, Prisma ORM
* **Database:** PostgreSQL (NeonDB Serverless)
* **Cloud Media:** Cloudinary (Dynamic asset optimization & color-variant image synchronization)
* **DevOps & CI/CD:** Git, GitHub, Vercel Automated Pipelines

---

## ✨ Key Features & Capabilities

### 🛍️ Customer Storefront & UX
* **Dynamic Product Catalog:** Multi-level filtering by collection (*Men, Women, Kids*), category, price, and attributes.
* **Live Global Search Bar:** Instant real-time search lookup matching product titles, descriptions, and categories.
* **Customer Wishlist:** Persistent save-for-later wishlist functionality with quick-add capabilities.
* **Variant-Specific Gallery:** Interactive color swatches that instantly synchronize and update the main image gallery and thumbnails.
* **Streamlined Checkout & "Buy Now":** Instant direct-to-checkout option with strict stock validation, Cash on Delivery (COD), and Bank Transfer options.

### 🛡️ Administrative Control Center
* **Granular Product Management:** Add and edit products with custom specifications (*Embellishment, Heel Type, Heel Height, Lining Material, Shoe Sole, Upper Material*), numerical stock tracking, and collection mapping.
* **Order Status Workflow:** Complete order lifecycle management with **Approve Payment** and **Reject Payment** actions.
* **Automated Transactional Emails:** Automated customer email dispatching for order confirmations, payment validation failures, and delivery success updates.
* **Banner Size Guidance:** Built-in design guidance and dimension helpers for homepage hero banners, category banners, and video reels.

---

## ⚙️ Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/areebaa7/step-styl-postgress.git](https://github.com/areebaa7/step-styl-postgress.git)
   cd step-styl-postgress
   Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory and add your credentials:

Code snippet
DATABASE_URL="your_postgresql_neon_url"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_smtp_password"
Run the development server:

Bash
npm run dev
Open http://localhost:3000 in your browser to view the application.

📄 License
This project is proprietary and confidential to Step & Styl.
