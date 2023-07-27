window.onload = async function () {
  const response = await fetch("/prefix");
  const data = await response.json();
  const PREFIX = data.prefix;

  const form = document.getElementById("form");
  const resultDiv = document.getElementById("result");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = form.url.value;
    const encodedUrl = encodeURIComponent(url); // use encodeURIComponent to properly encode the URL
    const proxyUrl = `${PREFIX}${encodedUrl}`;
    window.open(proxyUrl, "_blank"); // use window.open to open in a new tab
  });
  document.getElementById("plus-btn").addEventListener("click", function () {
    window.open("newpage.html", "_blank");
  });
  const plusButton = document.getElementById("plus-btn");

  plusButton.addEventListener("mouseover", function () {
    updateTooltipPosition();
  });

  plusButton.addEventListener("mouseout", function () {
    updateTooltipPosition();
  });

  function updateTooltipPosition() {
    const tooltip = document.getElementById("tooltip-text");
    const tooltipRect = tooltip.getBoundingClientRect();

    if (tooltipRect.right > window.innerWidth) {
      tooltip.style.right = "0";
      tooltip.style.left = "auto";
    } else {
      tooltip.style.left = "0";
      tooltip.style.right = "auto";
    }
  }
};
