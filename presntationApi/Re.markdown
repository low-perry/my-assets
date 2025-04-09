# Presentation API

The Presentation API aims to make presentation displays such as projectors, attached monitors, and network-connected TVs available to the Web. It takes into account displays that are attached using wired (HDMI, DVI, or similar) and wireless technologies (Miracast, Chromecast, DLNA, AirPlay, or similar).

Devices with limited screen size lack the ability to show Web content to a larger audience: a group of colleagues in a conference room, or friends and family at home, for example. Web content shown on a larger presentation display has greater perceived quality, legibility, and impact.

At its core, the Presentation API enables a controller page to show a presentation page on a presentation display and exchange messages with it. How the presentation page is transmitted to the display and how messages are exchanged between it and the controller page are left to the implementation; this allows the use of a wide variety of display technologies.

1-UA Mode
Scenario:
Imagine you're connected to an external display via HDMI or using Miracast. These connections are designed to carry only raw audio and video signals; they don’t support transmitting rich HTML content or executing JavaScript on the display itself.
How It Works:
- The User Agent (UA) on your controlling device (for example, your laptop or smartphone) does all the heavy lifting.
- It renders the presentation—this means it processes the HTML, CSS, and JavaScript to produce the final graphical and audio output.
- Then, the rendered audio and video output is sent to the presentation display using the operating system as a bridge.
- Meanwhile, the same UA handles communication between the controller (your command interface) and the presentation page internally.

Key Point:
The entire presentation is generated on a single UA. That UA must be able to both render the content and push the resulting output to the display. This is why it's called 1-UA mode.

2-UA Mode
Scenario:
Now imagine that the external display is more advanced—like a “smart” TV that can natively render HTML and run JavaScript—and can also connect to the network.
How It Works:
- In this setup, the controller’s UA doesn’t have to do all the rendering. Instead, it acts as a proxy.
- The UA instructs the presentation display (which has its own UA capabilities) to load and render the presentation directly.
- The presentation display, through its native capabilities, handles the heavy lifting of rendering HTML and styling it appropriately.
- All message exchanges between the controller and presentation happen over a network connection, rather than solely within the same UA.

Key Point:
There are two distinct user agents involved—one on the controller’s side and one on the presentation display’s side—which is why we call this 2-UA mode.

Summary Visual

| Mode | Display Connection Type | Who Renders the Presentation | Message Exchange | 
| -----| ------------------------|------------------------------| -----------------|
| 1-UA Mode | HDMI, Miracast (audio/video only) | The controlling UA (e.g., your laptop) | Internally within the same UA | 
| 2-UA Mode | Network-enabled (e.g., smart TV, web display) | Presentation display’s native UA | Over a network between the controller and presentation UAs | 



Why It Matters
- Flexibility:
The Presentation API accommodates a range of hardware configurations. Whether your display is basic (only audio/video) or advanced (can run HTML itself), the API defines a clear pathway for presenting content.
- Performance & Resource Allocation:
In 1-UA mode, the controlling device does extra work by rendering the content, which might be resource-intensive. In 2-UA mode, the work is distributed, potentially offering better performance on capable systems.
- Communication:
Both modes ensure that the controller and the presentation page can exchange messages—be it internal to the same browser process (1-UA) or across networked devices (2-UA). This keeps the presentation interactive, allowing for real-time control or updates.

Would you like to explore more examples, such as how to implement message passing in each mode, or discuss potential performance implications on different devices?

## Conformance classes

This specification describes the conformance criteria for two classes of user agents.

Controlling user agent
Web browsers that conform to the specifications of a controlling user agent must be able to start and control presentations by providing a controlling browsing context as described in this specification. This context implements the Presentation, PresentationAvailability, PresentationConnection, PresentationConnectionAvailableEvent, PresentationConnectionCloseEvent, and PresentationRequest interfaces.

Receiving user agent
Web browsers that conform to the specifications of a receiving user agent must be able to render presentations by providing a receiving browsing context as described in this specification. This context implements the Presentation, PresentationConnection, PresentationConnectionAvailableEvent, PresentationConnectionCloseEvent, PresentationConnectionList, and PresentationReceiver interfaces.

One user agent may act both as a controlling user agent and as a receiving user agent, if it provides both browsing contexts and implements all of their required interfaces. This can happen when the same user agent is able to host the controlling browsing context and the receiving browsing context for a presentation, as in the 1-UA mode implementation of the API.

Conformance requirements phrased against a user agent apply either to a controlling user agent, a receiving user agent or to both classes, depending on the context.

