async function run() {
  const data = await fetch("https://hidden-pelican-424.convex.cloud/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "test:testSearch",
      args: { query: "Paracetamol" },
      format: "json"
    })
  }).then(r => r.json());
  console.log(JSON.stringify(data, null, 2));
}
run();
