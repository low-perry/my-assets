// Check if the Presentation API is available in the current browser
if ("presentation" in navigator) {
  // Access the Presentation object
  const presentationObj = navigator.presentation;
  console.log("Presentation object:", presentationObj);
  // Create a PresentationRequest
  const presentationUrls = ["https://example.com/presentation.html"];
  const presentationRequest = new PresentationRequest(presentationUrls);
  console.log("Created a PresentationRequest:", presentationRequest);
  // Start a presentation session
  presentationRequest
    .start()
    .then((session) => {
      console.log("Presentation session started:", session);
    })
    .catch((error) => {
      console.error("Error starting presentation session:", error);
    });
} else {
  // Notify if the API is unavailable
  console.error("Presentation API is not available in this browser.");
}
