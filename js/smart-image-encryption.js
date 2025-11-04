// تفعيل زر الانتقال إلى موقع remove.bg
const btn = document.getElementById("goRemoveBg");

btn.addEventListener("click", () => {
  const url = "https://www.remove.bg";

  try {
    // إذا التطبيق مفتوح داخل WebIntoApp → يفتح في متصفح خارجي
    if (window.navigator.userAgent.includes("WebView") ||
        window.navigator.userAgent.includes("wv") ||
        window.location.href.includes("file://")) {
      window.open(url, "_system"); // خاص بتطبيقات WebView
    } else {
      // لو من متصفح عادي
      window.open(url, "_blank");
    }
  } catch (e) {
    // fallback في حال لم يدعم WebView
    window.location.href = url;
  }
});
