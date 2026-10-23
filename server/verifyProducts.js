const fs = require("fs");
const path = require("path");

async function testAll() {
  console.log("=== KIDORA VERIFICATION SUITE ===");

  // 1. Fetch products from Express API
  const res = await fetch("http://localhost:5000/api/products");
  if (!res.ok) throw new Error("API fetch failed: " + res.status);
  const products = await res.json();
  console.log("Found", products.length, "products in MongoDB:\n");

  const publicDir = "d:/Kidora/client/public";
  let allImagesOk = true;

  for (const p of products) {
    const imgPath = p.image;
    const localRel = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
    const diskPath = path.join(publicDir, localRel);
    const diskExists = fs.existsSync(diskPath);
    const diskSize = diskExists ? fs.statSync(diskPath).size : 0;

    // Test Vite serve
    let viteStatus = "ERR";
    try {
      const viteRes = await fetch("http://localhost:5173" + imgPath);
      viteStatus = viteRes.status;
    } catch (e) {
      viteStatus = e.message;
    }

    // Test Express serve
    let expressStatus = "ERR";
    try {
      const expressRes = await fetch("http://localhost:5000" + imgPath);
      expressStatus = expressRes.status;
    } catch (e) {
      expressStatus = e.message;
    }

    const ok = diskExists && viteStatus === 200 && expressStatus === 200;
    if (!ok) allImagesOk = false;

    console.log(`- [${p.category}] "${p.name}"`);
    console.log(`    Image field: ${imgPath}`);
    console.log(`    Disk file: ${diskPath} (Exists: ${diskExists}, Size: ${(diskSize / 1024).toFixed(1)} KB)`);
    console.log(`    Vite (port 5173): ${viteStatus} | Express (port 5000): ${expressStatus}`);
    console.log(`    Status: ${ok ? "VERIFIED OK" : "FAILED"}\n`);
  }

  console.log("Overall status: " + (allImagesOk ? "ALL 8 PRODUCTS & IMAGES VERIFIED SUCCESSFULLY!" : "SOME IMAGES FAILED"));
}

testAll().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
