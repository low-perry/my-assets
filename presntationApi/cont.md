API
6.1 Common idioms
A presentation display refers to a graphical and/or audio output device available to the user agent via an implementation specific connection technology.

A presentation connection is an object relating a controlling browsing context to its receiving browsing context and enables two-way-messaging between them. Each presentation connection has a presentation connection state, a unique presentation identifier to distinguish it from other presentations, and a presentation URL that is a URL used to create or reconnect to the presentation. A valid presentation identifier consists of alphanumeric ASCII characters only and is at least 16 characters long.

Some presentation displays may only be able to display a subset of Web content because of functional, security or hardware limitations. Examples are set-top boxes, smart TVs, or networked speakers capable of rendering only audio. We say that such a display is an available presentation display for a presentation URL if the controlling user agent can reasonably guarantee that presentation of the URL on that display will succeed.

A controlling browsing context (or controller for short) is a browsing context that has connected to a presentation by calling start or reconnect, or received a presentation connection via a connectionavailable event. In algorithms for PresentationRequest, the controlling browsing context is the browsing context whose JavaScript realm was used to construct the PresentationRequest.

The receiving browsing context (or presentation for short) is the browsing context responsible for rendering to a presentation display. A receiving browsing context can reside in the same user agent as the controlling browsing context or a different one. A receiving browsing context is created by following the steps to create a receiving browsing context.

In a procedure, the destination browsing context is the receiving browsing context when the procedure is initiated at the controlling browsing context, or the controlling browsing context if it is initiated at the receiving browsing context.

The set of controlled presentations, initially empty, contains the presentation connections created by the controlling browsing contexts for the controlling user agent (or a specific user profile within that user agent). The set of controlled presentations is represented by a list of PresentationConnection objects that represent the underlying presentation connections. Several PresentationConnection objects may share the same presentation URL and presentation identifier in that set, but there can be only one PresentationConnection with a specific presentation URL and presentation identifier for a given controlling browsing context.

The set of presentation controllers, initially empty, contains the presentation connections created by a receiving browsing context for the receiving user agent. The set of presentation controllers is represented by a list of PresentationConnection objects that represent the underlying presentation connections. All presentation connections in this set share the same presentation URL and presentation identifier.

In a receiving browsing context, the presentation controllers monitor, initially set to null, exposes the current set of presentation controllers to the receiving application. The presentation controllers monitor is represented by a PresentationConnectionList.

In a receiving browsing context, the presentation controllers promise, which is initially set to null, provides the presentation controllers monitor once the initial presentation connection is established. The presentation controllers promise is represented by a Promise that resolves with the presentation controllers monitor.

In a controlling browsing context, the default presentation request, which is initially set to null, represents the request to use when the user wishes to initiate a presentation connection from the browser chrome.

The task source for the tasks mentioned in this specification is the presentation task source.

When an algorithm queues a Presentation API task T, the user agent MUST queue a global task T on the presentation task source using the global object of the current realm.

Unless otherwise specified, the JavaScript realm for script objects constructed by algorithm steps is the current realm.

6.2 Interface Presentation
WebIDL
partial interface Navigator {
  [SecureContext, SameObject] readonly attribute Presentation presentation;
};

[SecureContext, Exposed=Window]
interface Presentation {
};
The presentation attribute is used to retrieve an instance of the Presentation interface. It MUST return the Presentation instance.

6.2.1 Controlling user agent
Controlling user agents MUST implement the following partial interface:

WebIDL
partial interface Presentation {
  attribute PresentationRequest? defaultRequest;
};
The defaultRequest attribute MUST return the default presentation request if any, null otherwise. On setting, the default presentation request MUST be set to the new value.

The controlling user agent SHOULD initiate presentation using the default presentation request only when the user has expressed an intention to do so via a user gesture, for example by clicking a button in the browser chrome.

To initiate presentation using the default presentation request, the controlling user agent MUST follow the steps to start a presentation from a default presentation request.

Support for initiating a presentation using the default presentation request is OPTIONAL.

Note
If a controlling user agent does not support starting a presentation from a default presentation request, that user agent should ignore any value set for defaultRequest.
6.2.2 Receiving user agent
Receiving user agents MUST implement the following partial interface:

WebIDL
partial interface Presentation {
  readonly attribute PresentationReceiver? receiver;
};
The receiver attribute MUST return the PresentationReceiver instance associated with the receiving browsing context and created by the receiving user agent when the receiving browsing context is created. In any other browsing context (including child navigables of the receiving browsing context) it MUST return null.

Note
Web developers can use navigator.presentation.receiver to detect when a document is loaded as a presentation.

6.3 Interface PresentationRequest
WebIDL
[SecureContext, Exposed=Window]
interface PresentationRequest : EventTarget {
  constructor(USVString url);
  constructor(sequence<USVString> urls);
  Promise<PresentationConnection> start();
  Promise<PresentationConnection> reconnect(USVString presentationId);
  Promise<PresentationAvailability> getAvailability();

  attribute EventHandler onconnectionavailable;
};
A PresentationRequest object is associated with a request to initiate or reconnect to a presentation made by a controlling browsing context. The PresentationRequest object MUST be implemented in a controlling browsing context provided by a controlling user agent.

When a PresentationRequest is constructed, the given urls MUST be used as the list of presentation request URLs which are each a possible presentation URL for the PresentationRequest instance.

6.3.1 Constructing a PresentationRequest
When the PresentationRequest constructor is called, the controlling user agent MUST run these steps:

Input
url or urls, the presentation request URLs
Output
A new PresentationRequest object
If the document object's active sandboxing flag set has the sandboxed presentation browsing context flag set, then throw a SecurityError and abort these steps.
If urls is an empty sequence, then throw a NotSupportedError and abort all remaining steps.
If a single url was provided, let urls be a one item array containing url.
Let presentationUrls be an empty list of URLs.
For each URL U in urls:
Let A be an absolute URL that is the result of parsing U relative to the API base URL specified by the current settings object.
If the parse a URL algorithm failed, then throw a SyntaxError exception and abort all remaining steps.
If A's scheme is supported by the controlling user agent, add A to presentationUrls.
If presentationUrls is an empty list, then throw a NotSupportedError and abort all remaining steps.
If any member of presentationUrls is not a potentially trustworthy URL, then throw a SecurityError and abort these steps.
Construct a new PresentationRequest object with presentationUrls as its presentation request URLs and return it.
6.3.2 Selecting a presentation display
When the start method is called, the user agent MUST run the following steps to select a presentation display.

Input
presentationRequest, the PresentationRequest object that received the call to start
Output
A new Promise
If the document's active window does not have transient activation, return a Promise rejected with an InvalidAccessError exception and abort these steps.
Let topContext be the top-level browsing context of the controlling browsing context.
If there is already an unsettled Promise from a previous call to start in topContext or any browsing context in the descendant navigables of topContext, return a new Promise rejected with an OperationError exception and abort all remaining steps.
Let P be a new Promise.
Return P, but continue running these steps in parallel.
If the user agent is not monitoring the list of available presentation displays, run the steps to monitor the list of available presentation displays in parallel.
Let presentationUrls be the presentation request URLs of presentationRequest.
Request user permission for the use of a presentation display and selection of one presentation display.
If either of the following is true:
The list of available presentation displays is empty and will remain so before the request for user permission is completed.
No member in the list of available presentation displays is an available presentation display for any member of presentationUrls.
Then run the following steps:
Queue a Presentation API task to reject P with a NotFoundError exception.
Abort all remaining steps.
If the user denies permission to use a display, queue a Presentation API task to reject P with an NotAllowedError exception, and abort all remaining steps.
Otherwise, the user grants permission to use a display; let D be that display.
Run the steps to start a presentation connection with presentationRequest, D, and P.
Note
The details of implementing the permission request and display selection are left to the user agent; for example it may show the user a dialog and allow the user to select an available display (granting permission), or cancel the selection (denying permission). Implementers are encouraged to show the user whether an available display is currently in use, to facilitate presentations that can make use of multiple displays.
Note
Receiving user agents are encouraged to advertise a user friendly name for the presentation display, e.g. "Living Room TV", to assist the user in selecting the intended display. Implementers of receiving user agents are also encouraged to advertise the locale and intended text direction of the user friendly name. Implementers of controlling user agents are encouraged to render a user friendly name using its locale and text direction when they are known.
6.3.3 Starting a presentation from a default presentation request
When the user expresses an intent to start presentation of a document on a presentation display using the browser chrome (via a dedicated button, user gesture, or other signal), that user agent MUST run the following steps to start a presentation from a default presentation request. If no default presentation request is set on the document, these steps MUST not be run.

Input
W, the document on which the user has expressed an intent to start presentation
presentationRequest, the non-null value of navigator.presentation.defaultRequest set on W
D, the presentation display that is the target for presentation
Run the following steps in parallel.
Let presentationUrls be the presentation request URLs of presentationRequest.
If there is no presentation request URL for presentationRequest for which D is an available presentation display, then abort these steps.
Run the steps to start a presentation connection with presentationRequest and D.
Note
When starting a presentation from a default presentation request, a controlling user agent may allow the user to request presentation and choose the intended presentation display with the same user gesture. For example, the browser chrome could allow the user to pick a display from a menu, or allow the user to tap on an Near Field Communications (NFC) enabled display.
6.3.4 Starting a presentation connection
When the user agent is to start a presentation connection, it MUST run the following steps:

Input
presentationRequest, the PresentationRequest that is used to start the presentation connection
D, the selected presentation display
P, an optional Promise that will be resolved with a new presentation connection
Assert: this is running in parallel.
Let I be a new valid presentation identifier unique among all presentation identifiers for known presentation connections in the set of controlled presentations. To avoid fingerprinting, implementations SHOULD set the presentation identifier to a UUID generated by following forms 4.4 or 4.5 of [rfc4122].
Create a new PresentationConnection S.
Set the presentation identifier of S to I.
Let presentationUrls be the presentation request URLs of presentationRequest.
Set the presentation URL for S to the first presentationUrl in presentationUrls for which there exists an entry (presentationUrl, D) in the list of available presentation displays.
Set the presentation connection state of S to connecting.
Add S to the set of controlled presentations.
If P is provided, queue a Presentation API task to resolve P with S.
Queue a Presentation API task to fire an event named connectionavailable, that uses the PresentationConnectionAvailableEvent interface, with the connection attribute initialized to S, at presentationRequest. The event must not bubble and must not be cancelable.
Let U be the user agent connected to D.
If the next step fails, abort all remaining steps and close the presentation connection S with error as closeReason, and a human readable message describing the failure as closeMessage.
Using an implementation specific mechanism, tell U to create a receiving browsing context with D, presentationUrl, and I as parameters.
Establish a presentation connection with S.
Note
The presentationUrl should name a resource accessible to the local or a remote user agent. This specification defines behavior for presentationUrl using the http or https schemes; behavior for other schemes is not defined by this specification.
6.3.5 Reconnecting to a presentation
When the reconnect method is called, the user agent MUST run the following steps to reconnect to a presentation:

Input
presentationRequest, the PresentationRequest object that reconnect was called on
presentationId, a valid presentation identifier
Output
P, a new Promise
Let P be a new Promise.
Return P, but continue running these steps in parallel.
Search the set of controlled presentations for a PresentationConnection that meets the following criteria:
Its controlling browsing context is the current browsing context
Its presentation connection state is not terminated
Its presentation URL is equal to one of the presentation request URLs of presentationRequest
Its presentation identifier is equal to presentationId
If such a PresentationConnection exists, run the following steps:
Let existingConnection be that PresentationConnection.
Queue a Presentation API task to resolve P with existingConnection.
If the presentation connection state of existingConnection is connecting or connected, then abort all remaining steps.
Set the presentation connection state of existingConnection to connecting.
Establish a presentation connection with existingConnection.
Abort all remaining steps.
Search the set of controlled presentations for the first PresentationConnection that meets the following criteria:
Its controlling browsing context is not the current browsing context
Its presentation connection state is not terminated
Its presentation URL is equal to one of the presentation request URLs of presentationRequest
Its presentation identifier is equal to presentationId
If such a PresentationConnection exists, run the following steps:
Let existingConnection be that PresentationConnection.
Create a new PresentationConnection newConnection.
Set the presentation identifier of newConnection to presentationId.
Set the presentation URL of newConnection to the presentation URL of existingConnection.
Set the presentation connection state of newConnection to connecting.
Add newConnection to the set of controlled presentations.
Queue a Presentation API task to resolve P with newConnection.
Queue a Presentation API task to fire an event named connectionavailable, that uses the PresentationConnectionAvailableEvent interface, with the connection attribute initialized to newConnection, at presentationRequest. The event must not bubble and must not be cancelable.
Establish a presentation connection with newConnection.
Abort all remaining steps.
Queue a Presentation API task to reject P with a NotFoundError exception.
6.3.6 Event Handlers
The following are the event handlers (and their corresponding event handler event types) that must be supported, as event handler IDL attributes, by objects implementing the PresentationRequest interface:

Event handler	Event handler event type
onconnectionavailable	connectionavailable
6.4 Interface PresentationAvailability
WebIDL
[SecureContext, Exposed=Window]
interface PresentationAvailability : EventTarget {
  readonly attribute boolean value;

  attribute EventHandler onchange;
};
A PresentationAvailability object exposes the presentation display availability for a presentation request. The presentation display availability for a PresentationRequest stores whether there is currently any available presentation display for at least one of the presentation request URLs of the request.

The presentation display availability for a presentation request is eligible for garbage collection when no ECMASCript code can observe the PresentationAvailability object.

If the controlling user agent can monitor the list of available presentation displays in the background (without a pending request to start), the PresentationAvailability object MUST be implemented in a controlling browsing context.

The value attribute MUST return the last value it was set to. The value is initialized and updated by the monitor the list of available presentation displays algorithm.

The onchange attribute is an event handler whose corresponding event handler event type is change.

6.4.1 The set of presentation availability objects
The user agent MUST keep track of the set of presentation availability objects created by the getAvailability method. The set of presentation availability objects is represented as a set of tuples (A, availabilityUrls), initially empty, where:

A is a live PresentationAvailability object.
availabilityUrls is the list of presentation request URLs for the PresentationRequest when getAvailability was called on it to create A.
6.4.2 The list of available presentation displays
The user agent MUST keep a list of available presentation displays. The list of available presentation displays is represented by a list of tuples (availabilityUrl, display). An entry in this list means that display is currently an available presentation display for availabilityUrl. This list of presentation displays may be used for starting new presentations, and is populated based on an implementation specific discovery mechanism. It is set to the most recent result of the algorithm to monitor the list of available presentation displays.

While the set of presentation availability objects is not empty, the user agent MAY monitor the list of available presentation displays continuously, so that pages can use the value property of a PresentationAvailability object to offer presentation only when there are available displays. However, the user agent may not support continuous availability monitoring in the background; for example, because of platform or power consumption restrictions. In this case the Promise returned by getAvailability is rejected, and the algorithm to monitor the list of available presentation displays will only run as part of the select a presentation display algorithm.

When the set of presentation availability objects is empty (that is, there are no availabilityUrls being monitored), user agents SHOULD NOT monitor the list of available presentation displays to satisfy the power saving non-functional requirement. To further save power, the user agent MAY also keep track of whether a page holding a PresentationAvailability object is in the foreground. Using this information, implementation specific discovery of presentation displays can be resumed or suspended.

6.4.3 Getting the presentation displays availability information
When the getAvailability method is called, the user agent MUST run the following steps:

Input
presentationRequest, the PresentationRequest object that received the call to getAvailability
Output
A new Promise
Let P be a new Promise constructed in the JavaScript realm of presentationRequest.
Return P, but continue running these steps in parallel.
If the user agent is unable to continuously monitor the list of available presentation displays in the background, but can later find presentation displays in order to start a connection, then:
Queue a Presentation API task to reject P with a NotSupportedError exception.
Abort all the remaining steps.
If the presentation display availability for presentationRequest is not null, then:
Queue a Presentation API task to resolve P with the request's presentation display availability.
Abort all the remaining steps.
Set the presentation display availability for presentationRequest to a newly created PresentationAvailability object constructed in the JavaScript realm of presentationRequest, and let A be that object.
Create a tuple (A, presentationUrls) and add it to the set of presentation availability objects.
Run the algorithm to monitor the list of available presentation displays.
Note
The monitoring algorithm must be run at least one more time after the previous step to pick up the tuple that was added to the set of presentation availability objects.
Queue a Presentation API task to resolve P with A.
6.4.4 Monitoring the list of available presentation displays
If the set of presentation availability objects is non-empty, or there is a pending request to select a presentation display, the user agent MUST monitor the list of available presentation displays by running the following steps:

Assert: this is running in parallel.
Let availabilitySet be a shallow copy of the set of presentation availability objects.
If there is a pending request to select a presentation display for a PresentationRequest and if the PresentationRequest's presentation display availability is null, then run the following substeps:
Let A be a newly created PresentationAvailability object.
Create a tuple (A, presentationUrls) where presentationUrls is the PresentationRequest's presentation request URLs and add it to availabilitySet.
Let newDisplays be an empty list.
If the user agent is unable to retrieve presentation displays (e.g., because the user has disabled this capability), then skip the following step.
Retrieve presentation displays (using an implementation specific mechanism) and set newDisplays to this list.
Set the list of available presentation displays to the empty list.
For each member (A, availabilityUrls) of availabilitySet, run the following steps:
Set previousAvailability to the value of A's value property.
Let newAvailability be false.
For each availabilityUrl in availabilityUrls, run the following step:
For each display in newDisplays, if display is an available presentation display for availabilityUrl, then run the following steps:
Insert a tuple (availabilityUrl, display) into the list of available presentation displays, if no identical tuple already exists.
Set newAvailability to true.
If A's value property has not yet been initialized, then set A's value property to newAvailability and skip the following step.
If previousAvailability is not equal to newAvailability, then queue a Presentation API task to run the following steps:
Set A's value property to newAvailability.
Fire an event named change at A.
Note
The controlling user agent may choose how often to monitor the list of available presentation displays, including grouping requests from start and getAvailability, and aggregating them across browsing contexts.
When a presentation display availability object is eligible for garbage collection, the user agent SHOULD run the following steps:

Let A be the newly deceased PresentationAvailability object
Find and remove any entry (A, availabilityUrl) in the set of presentation availability objects.
If the set of presentation availability objects is now empty and there is no pending request to select a presentation display, cancel any pending task to monitor the list of available presentation displays for power saving purposes, and set the list of available presentation displays to the empty list.
Note
The mechanism used to monitor presentation displays availability and determine the compatibility of a presentation display with a given URL is left to the user agent.
6.4.5 Interface PresentationConnectionAvailableEvent
WebIDL
[SecureContext, Exposed=Window]
interface PresentationConnectionAvailableEvent : Event {
  constructor(DOMString type, PresentationConnectionAvailableEventInit eventInitDict);
  [SameObject] readonly attribute PresentationConnection connection;
};

dictionary PresentationConnectionAvailableEventInit : EventInit {
  required PresentationConnection connection;
};
A controlling user agent fires an event named connectionavailable on a PresentationRequest when a connection associated with the object is created. It is fired at the PresentationRequest instance, using the PresentationConnectionAvailableEvent interface, with the connection attribute set to the PresentationConnection object that was created. The event is fired for each connection that is created for the controller, either by the controller calling start or reconnect, or by the controlling user agent creating a connection on the controller's behalf via defaultRequest.

A receiving user agent fires an event named connectionavailable on a PresentationReceiver when an incoming connection is created. It is fired at the presentation controllers monitor, using the PresentationConnectionAvailableEvent interface, with the connection attribute set to the PresentationConnection object that was created. The event is fired for all connections that are created when monitoring incoming presentation connections.

The connection attribute MUST return the value it was set to when the PresentationConnection object was created.

When the PresentationConnectionAvailableEvent constructor is called, the user agent MUST construct a new PresentationConnectionAvailableEvent object with its connection attribute set to the connection member of the PresentationConnectionAvailableEventInit object passed to the constructor.

6.5 Interface PresentationConnection
Each presentation connection is represented by a PresentationConnection object. Both the controlling user agent and receiving user agent MUST implement PresentationConnection.

WebIDL
enum PresentationConnectionState { "connecting", "connected", "closed", "terminated" };

[SecureContext, Exposed=Window]
interface PresentationConnection : EventTarget {
  readonly attribute USVString id;
  readonly attribute USVString url;
  readonly attribute PresentationConnectionState state;
  undefined close();
  undefined terminate();
  attribute EventHandler onconnect;
  attribute EventHandler onclose;
  attribute EventHandler onterminate;

  // Communication
  attribute BinaryType binaryType;
  attribute EventHandler onmessage;
  undefined send (DOMString message);
  undefined send (Blob data);
  undefined send (ArrayBuffer data);
  undefined send (ArrayBufferView data);
};
The id attribute specifies the presentation connection's presentation identifier.

The url attribute specifies the presentation connection's presentation URL.

The state attribute represents the presentation connection's current state. It can take one of the values of PresentationConnectionState depending on the connection state:

connecting means that the user agent is attempting to establish a presentation connection with the destination browsing context. This is the initial state when a PresentationConnection object is created.
connected means that the presentation connection is established and communication is possible.
closed means that the presentation connection has been closed, or could not be opened. It may be re-opened through a call to reconnect. No communication is possible.
terminated means that the receiving browsing context has been terminated. Any presentation connection to that presentation is also terminated and cannot be re-opened. No communication is possible.
Note
A connected state does not mean that sending or receiving messages will succeed, as the communication channel may be abruptly closed at any time. Applications that wish to detect such situations as soon as possible should implement their own keep-alive mechanism.
When the close method is called on a PresentationConnection S, the user agent MUST start closing the presentation connection S with closed as closeReason and an empty message as closeMessage.

When the terminate method is called on a PresentationConnection S in a controlling browsing context, the user agent MUST run the algorithm to terminate a presentation in a controlling browsing context using S.

When the terminate method is called on a PresentationConnection S in a receiving browsing context, the user agent MUST run the algorithm to terminate a presentation in a receiving browsing context using S.

The binaryType attribute can take one of the values of BinaryType. When a PresentationConnection object is created, its binaryType attribute MUST be set to the string "arraybuffer". On getting, it MUST return the last value it was set to. On setting, the user agent MUST set the attribute to the new value.

Note
The binaryType attribute allows authors to control how binary data is exposed to scripts. By setting the attribute to "blob", binary data is returned in Blob form; by setting it to "arraybuffer", it is returned in ArrayBuffer form. The attribute defaults to "arraybuffer". This attribute has no effect on data sent in a string form.
When the send method is called on a PresentationConnection S, the user agent MUST run the algorithm to send a message through S.

When a PresentationConnection object S is discarded (because the document owning it is navigating or is closed) while the presentation connection state of S is connecting or connected, the user agent MUST start closing the presentation connection S with wentaway as closeReason and an empty closeMessage.

If the user agent receives a signal from the destination browsing context that a PresentationConnection S is to be closed, it MUST close the presentation connection S with closed or wentaway as closeReason and an empty closeMessage.

6.5.1 Establishing a presentation connection
When the user agent is to establish a presentation connection using a presentation connection, it MUST run the following steps:

Input
presentationConnection, the PresentationConnection object that is to be connected
Assert: this is running in parallel.
If the presentation connection state of presentationConnection is not connecting, then abort all remaining steps.
Request connection of presentationConnection to the receiving browsing context. The presentation identifier of presentationConnection MUST be sent with this request.
If connection completes successfully, queue a Presentation API task to run the following steps:
Set the presentation connection state of presentationConnection to connected.
Fire an event named connect at presentationConnection.
If the connection cannot be completed, close the presentation connection S with error as closeReason, and a human readable message describing the failure as closeMessage.
Note
The mechanism that is used to present on the remote display and connect the controlling browsing context with the presented document is an implementation choice of the user agent. The connection must provide a two-way messaging abstraction capable of carrying DOMString and binary payloads in a reliable and in-order fashion as described in the Send a Message and Receive a Message steps below.
6.5.2 Sending a message through PresentationConnection
Note
No specific transport for the connection between the controlling browsing context and the receiving browsing context is mandated, except that for multiple calls to send it has to be ensured that messages are delivered to the other end reliably and in sequence. The transport should function equivalently to an RTCDataChannel in reliable mode.
Let presentation message data be the payload data to be transmitted between two browsing contexts. Let presentation message type be the type of that data, one of text or binary.

When the user agent is to send a message through a presentation connection, it MUST run the following steps:

Input
presentationConnection, the presentation connection connected to the other browsing context
messageOrData, the presentation message data to send to the other browsing context
If the state property of presentationConnection is not connected, throw an InvalidStateError exception.
If the closing procedure of presentationConnection has started, then abort these steps.
Let presentation message type messageType be binary if messageOrData is of type ArrayBuffer, ArrayBufferView, or Blob. Let messageType be text if messageOrData is of type DOMString.
Using an implementation specific mechanism, transmit the contents of messageOrData as the presentation message data and messageType as the presentation message type to the destination browsing context.
If the previous step encounters an unrecoverable error, then abruptly close the presentation connection presentationConnection with error as closeReason, and a closeMessage describing the error encountered.
Note
To assist applications in recovery from an error sending a message through a presentation connection, the user agent should include details of which attempt failed in closeMessage, along with a human readable string explaining the failure reason. Example renditions of closeMessage:

Unable to send text message (network_error): "hello" for DOMString messages, where "hello" is the first 256 characters of the failed message.
Unable to send binary message (invalid_message) for ArrayBuffer, ArrayBufferView and Blob messages.
Note
When sending a user-visible string via a presentation connection, the page author should take care to ensure that locale information is also propagated so that the destination user agent can know how to best render the string. See the examples for one solution.
6.5.3 Receiving a message through PresentationConnection
When the user agent has received a transmission from the remote side consisting of presentation message data and presentation message type, it MUST run the following steps to receive a message through a PresentationConnection:

Input
presentationConnection, the presentation connection receiving the message
messageType, the presentation message type of the message
messageData, the presentation message data of the message
Assert: this is running in parallel.
If the state property of presentationConnection is not connected, abort these steps.
Let event be the result of creating an event using the MessageEvent interface, with the event type message, which does not bubble and is not cancelable.
Initialize the event's data attribute as follows:
If messageType is text, then initialize event's data attribute to messageData with type DOMString.
If messageType is binary, and binaryType attribute is set to "blob", then initialize event's data attribute to a new Blob object with messageData as its raw data.
If messageType is binary, and binaryType attribute is set to "arraybuffer", then initialize event's data attribute to a new ArrayBuffer object whose contents are messageData.
Queue a Presentation API task to fire event at presentationConnection.
If the user agent encounters an unrecoverable error while receiving a message through presentationConnection, it MUST abruptly close the presentation connection presentationConnection with error as closeReason. It SHOULD use a human readable description of the error encountered as closeMessage.

6.5.4 Interface PresentationConnectionCloseEvent
WebIDL
enum PresentationConnectionCloseReason { "error", "closed", "wentaway" };

[SecureContext, Exposed=Window]
interface PresentationConnectionCloseEvent : Event {
  constructor(DOMString type, PresentationConnectionCloseEventInit eventInitDict);
  readonly attribute PresentationConnectionCloseReason reason;
  readonly attribute DOMString message;
};

dictionary PresentationConnectionCloseEventInit : EventInit {
  required PresentationConnectionCloseReason reason;
  DOMString message = "";
};
A PresentationConnectionCloseEvent is fired when a presentation connection enters a closed state. The reason attribute provides the reason why the connection was closed. It can take one of the values of PresentationConnectionCloseReason:

error means that the mechanism for connecting or communicating with a presentation entered an unrecoverable error.
closed means that either the controlling browsing context or the receiving browsing context that were connected by the PresentationConnection called close().
wentaway means that the browser closed the connection, for example, because the browsing context that owned the connection navigated or was discarded.
When the reason attribute is error, the user agent SHOULD set the message attribute to a human readable description of how the communication channel encountered an error.

When the PresentationConnectionCloseEvent constructor is called, the user agent MUST construct a new PresentationConnectionCloseEvent object, with its reason attribute set to the reason member of the PresentationConnectionCloseEventInit object passed to the constructor, and its message attribute set to the message member of this PresentationConnectionCloseEventInit object if set, to an empty string otherwise.

6.5.5 Closing a PresentationConnection
When the user agent is to start closing a presentation connection, it MUST do the following:

Input
presentationConnection, the presentation connection to be closed
closeReason, the PresentationConnectionCloseReason describing why the connection is to be closed
closeMessage, a human-readable message with details of why the connection was closed
If the presentation connection state of presentationConnection is not connecting or connected then abort the remaining steps.
Set the presentation connection state of presentationConnection to closed.
Start to signal to the destination browsing context the intention to close the corresponding PresentationConnection, passing the closeReason to that context. The user agent does not need to wait for acknowledgement that the corresponding PresentationConnection was actually closed before proceeding to the next step.
If closeReason is not wentaway, then locally run the steps to close the presentation connection with presentationConnection, closeReason, and closeMessage.
When the user agent is to close a presentation connection, it MUST do the following:

Input
presentationConnection, the presentation connection to be closed
closeReason, the PresentationConnectionCloseReason describing why the connection is to be closed
closeMessage, a human-readable message with details of why the connection was closed.
If there is a pending close the presentation connection task for presentationConnection, or a close the presentation connection task has already run for presentationConnection, then abort the remaining steps.
Queue a Presentation API task to run the following steps:
If the presentation connection state of presentationConnection is not connecting, connected, or closed, then abort the remaining steps.
If the presentation connection state of presentationConnection is not closed, set it to closed.
If the presentationConnection was created as a result of monitoring incoming presentation connections in a receiving browsing context, run the following sub-steps.
Remove presentationConnection from the set of presentation controllers.
Populate the presentation controllers monitor with the set of presentation controllers.
Fire an event named close, that uses the PresentationConnectionCloseEvent interface, with the reason attribute initialized to closeReason and the message attribute initialized to closeMessage, at presentationConnection. The event must not bubble and must not be cancelable.
6.5.6 Terminating a presentation in a controlling browsing context
When a controlling user agent is to terminate a presentation in a controlling browsing context using connection, it MUST run the following steps:

If the presentation connection state of connection is not connected or connecting, then abort these steps.
Otherwise, for each known connection in the set of controlled presentations in the controlling user agent:
If the presentation identifier of known connection and connection are equal, and the presentation connection state of known connection is connected or connecting, then queue a global task on the presentation task source given known connection's relevant global object to run the following steps:
Set the presentation connection state of known connection to terminated.
Fire an event named terminate at known connection.
In parallel, send a termination request for the presentation to its receiving user agent using an implementation specific mechanism.
6.5.7 Terminating a presentation in a receiving browsing context
When any of the following occur, the receiving user agent MUST terminate a presentation in a receiving browsing context:

The receiving user agent is to unload a document corresponding to the receiving browsing context, e.g. in response to a request to navigate that context to a new resource.
The user requests to terminate the presentation via the receiving user agent.
Note
This could happen by an explicit user action, or as a policy of the user agent. For example, the receiving user agent could be configured to terminate presentations whose PresentationConnection objects are all closed for 30 minutes.

A controlling user agent sends a termination request to the receiving user agent for that presentation.
When a receiving user agent is to terminate a presentation in a receiving browsing context, it MUST run the following steps:

Let P be the presentation to be terminated, let allControllers be the set of presentation controllers that were created for P, and connectedControllers an empty list.
For each connection in allControllers, run the following steps:
If the presentation connection state of connection is connected, then add connection to connectedControllers.
Set the presentation connection state of connection to terminated.
If there is a receiving browsing context for P, and it has a document for P that is not unloaded, unload a document corresponding to that browsing context, remove that browsing context from the user interface and discard it.
For each connection in connectedControllers, send a termination confirmation for P using an implementation specific mechanism to the controlling user agent that owns the destination browsing context for connection.
Note
Only one termination confirmation needs to be sent per controlling user agent.

6.5.8 Handling a termination confirmation in a controlling user agent
When a receiving user agent is to send a termination confirmation for a presentation P, and that confirmation was received by a controlling user agent, the controlling user agent MUST run the following steps:

For each connection in the set of controlled presentations that was connected to P, queue a global task on the presentation task source given connection's relevant global object to run the following steps:
If the presentation connection state of connection is not connected or connecting, then abort the following steps.
Set the presentation connection state of connection to terminated.
Fire an event named terminate at connection.
6.5.9 Event Handlers
The following are the event handlers (and their corresponding event handler event types) that must be supported, as event handler IDL attributes, by objects implementing the PresentationConnection interface:

Event handler	Event handler event type
onmessage	message
onconnect	connect
onclose	close
onterminate	terminate
6.6 Interface PresentationReceiver
WebIDL
[SecureContext, Exposed=Window]
interface PresentationReceiver {
  readonly attribute Promise<PresentationConnectionList> connectionList;
};
The PresentationReceiver interface allows a receiving browsing context to access the controlling browsing contexts and communicate with them. The PresentationReceiver interface MUST be implemented in a receiving browsing context provided by a receiving user agent.

On getting, the connectionList attribute MUST return the result of running the following steps:

If the presentation controllers promise is not null, return the presentation controllers promise and abort all remaining steps.
Otherwise, let the presentation controllers promise be a new Promise constructed in the JavaScript realm of this PresentationReceiver object.
Return the presentation controllers promise.
If the presentation controllers monitor is not null, resolve the presentation controllers promise with the presentation controllers monitor.
6.6.1 Creating a receiving browsing context
When the user agent is to create a receiving browsing context, it MUST run the following steps:

Input
D, a presentation display chosen by the user
presentationUrl, the presentation request URL
presentationId, the presentation identifier
Create a new top-level browsing context C, set to display content on D.
Set the session history of C to be the empty list.
Set the sandboxed modals flag and the sandboxed auxiliary navigation browsing context flag on C.
If the receiving user agent implements [PERMISSIONS], set the permission state of all permission descriptor types for C to "denied".
Create a new empty cookie store for C.
Create a new empty store for C to hold HTTP authentication states.
Create a new empty storage for session storage areas and local storage areas for C.
If the receiving user agent implements [INDEXEDDB], create a new empty storage for IndexedDB databases for C.
If the receiving user agent implements [SERVICE-WORKERS], create a new empty list of registered service worker registrations and a new empty set of Cache objects for C.
Navigate C to presentationUrl.
Start monitoring incoming presentation connections for C with presentationId and presentationUrl.
All child navigables created by the presented document, i.e. that have the receiving browsing context as their top-level browsing context, MUST also have restrictions 2-4 above. In addition, they MUST have the sandboxed top-level navigation without user activation browsing context flag set. All of these browsing contexts MUST also share the same browsing state (storage) for features 5-10 listed above.

When the top-level browsing context attempts to navigate to a new resource and runs the steps to navigate, it MUST follow step 1 to determine if it is allowed to navigate. In addition, it MUST NOT be allowed to navigate itself to a new resource, except by navigating to a fragment identifier or by reloading its document.

Note
This allows the user to grant permission based on the origin of the presentation URL shown when selecting a presentation display.

If the top-level-browsing context was not allowed to navigate, it SHOULD NOT offer to open the resource in a new top-level browsing context, but otherwise SHOULD be consistent with the steps to navigate.

Window clients and worker clients associated with the receiving browsing context and its descendant navigables must not be exposed to service workers associated with each other.

When the receiving browsing context is terminated, any service workers associated with it and the browsing contexts in its descendant navigables MUST be unregistered and terminated. Any browsing state associated with the receiving browsing context and the browsing contexts in its descendant navigables, including session history, the cookie store, any HTTP authentication state, any databases, the session storage areas, the local storage areas, the list of registered service worker registrations and the Cache objects MUST be discarded and not used for any other browsing context.

Note
This algorithm is intended to create a well defined environment to allow interoperable behavior for 1-UA and 2-UA presentations, and to minimize the amount of state remaining on a presentation display used for a 2-UA presentation.

The receiving user agent SHOULD fetch resources in a receiving browsing context with an HTTP Accept-Language header that reflects the language preferences of the controlling user agent (i.e., with the same Accept-Language that the controlling user agent would have sent). This will help the receiving user agent render the presentation with fonts and locale-specific attributes that reflect the user's preferences.

Note
Given the operating context of the presentation display, some Web APIs will not work by design (for example, by requiring user input) or will be obsolete (for example, by attempting window management); the receiving user agent should be aware of this. Furthermore, any modal user interface will need to be handled carefully. The sandboxed modals flag is set on the receiving browsing context to prevent most of these operations.

Note
As noted in Conformance, a user agent that is both a controlling user agent and receiving user agent may allow a receiving browsing context to create additional presentations (thus becoming a controlling browsing context as well). Web developers can use navigator.presentation.receiver to detect when a document is loaded as a receiving browsing context.

6.7 Interface PresentationConnectionList
WebIDL
[SecureContext, Exposed=Window]
interface PresentationConnectionList : EventTarget {
  readonly attribute FrozenArray<PresentationConnection> connections;
  attribute EventHandler onconnectionavailable;
};
The connections attribute MUST return the non-terminated set of presentation connections in the set of presentation controllers.

6.7.1 Monitoring incoming presentation connections
When the receiving user agent is to start monitoring incoming presentation connections in a receiving browsing context from controlling browsing contexts, it MUST listen to and accept incoming connection requests from a controlling browsing context using an implementation specific mechanism. When a new connection request is received from a controlling browsing context, the receiving user agent MUST run the following steps:

Input
I, the presentation identifier passed by the controlling browsing context with the incoming connection request
presentationId, the presentation identifier used to create the receiving browsing context
presentationUrl, the presentation request URL used to create the receiving browsing context
Assert: this is running in parallel.
If presentationId and I are not equal, refuse the connection and abort all remaining steps.
Create a new PresentationConnection S.
Set the presentation identifier of S to I.
Set the presentation URL of S to presentationUrl.
Establish the connection between the controlling and receiving browsing contexts using an implementation specific mechanism.
If connection establishment completes successfully, set the presentation connection state of S to connected. Otherwise, set the presentation connection state of S to closed and abort all remaining steps.
Add S to the set of presentation controllers.
If the presentation controllers monitor is null, run the following steps in parallel.
Let the presentation controllers monitor be a new PresentationConnectionList constructed in the JavaScript realm of the PresentationReceiver object of the receiving browsing context.
Populate the presentation controllers monitor with the set of presentation controllers.
If the presentation controllers promise is not null, queue a Presentation API task to resolve the presentation controllers promise with the presentation controllers monitor.
Abort all remaining steps.
Otherwise, run the following steps in parallel.
Populate the presentation controllers monitor with the set of presentation controllers.
Queue a Presentation API task to fire an event named connectionavailable, that uses the PresentationConnectionAvailableEvent interface, with the connection attribute initialized to S, at the presentation controllers monitor. The event must not bubble and must not be cancelable.
6.7.2 Event Handlers
The following are the event handlers (and their corresponding event handler event types) that must be supported, as event handler IDL attributes, by objects implementing the PresentationConnectionList interface:

Event handler	Event handler event type
onconnectionavailable	connectionavailable
7. Security and privacy considerations
This section is non-normative.

7.1 Personally identifiable information
The change event fired on the PresentationAvailability object reveals one bit of information about the presence or absence of a presentation display, often discovered through the browser's local area network. This could be used in conjunction with other information for fingerprinting the user. However, this information is also dependent on the user's local network context, so the risk is minimized.

The API enables monitoring the list of available presentation displays. How the user agent determines the compatibility and availability of a presentation display with a given URL is an implementation detail. If a controlling user agent matches a presentation request URL to a DIAL application to determine its availability, this feature can be used to probe information about which DIAL applications the user has installed on the presentation display without user consent.

7.2 Cross-origin access
A presentation is allowed to be accessed across origins; the presentation URL and presentation identifier used to create the presentation are the only information needed to reconnect to a presentation from any origin in the controlling user agent. In other words, a presentation is not tied to a particular opening origin.

This design allows controlling contexts from different origins to connect to a shared presentation resource. The security of the presentation identifier prevents arbitrary origins from connecting to an existing presentation.

This specification also allows a receiving user agent to publish information about its set of controlled presentations, and a controlling user agent to reconnect to presentations started from other devices. This is possible when the controlling browsing context obtains the presentation URL and presentation identifier of a running presentation from the user, local storage, or a server, and then connects to the presentation via reconnect.

This specification makes no guarantee as to the identity of any party connecting to a presentation. Once connected, the presentation may wish to further verify the identity of the connecting party through application-specific means. For example, the presentation could challenge the controller to provide a token via send that the presentation uses to verify identity and authorization.

7.3 User interface guidelines
Origin display
When the user is asked permission to use a presentation display during the steps to select a presentation display, the controlling user agent should make it clear what origin is requesting presentation and what origin will be presented.

Display of the origin requesting presentation will help the user understand what content is making the request, especially when the request is initiated from a child navigable. For example, embedded content may try to convince the user to click to trigger a request to start an unwanted presentation.

The sandboxed top-level navigation without user activation browsing context flag is set on the receiving browsing context to enforce that the top-level origin of the presentation remains the same during the lifetime of the presentation.

Cross-device access
When a user starts a presentation, the user will begin with exclusive control of the presentation. However, the Presentation API allows additional devices (likely belonging to distinct users) to connect and thereby control the presentation as well. When a second device connects to a presentation, it is recommended that all connected controlling user agents notify their users via the browser chrome that the original user has lost exclusive access, and there are now multiple controllers for the presentation.

In addition, it may be the case that the receiving user agent is capable of receiving user input, as well as acting as a presentation display. In this case, the receiving user agent should notify its user via browser chrome when a receiving browsing context is under the control of a remote party (i.e., it has one or more connected controllers).

7.4 Device Access
The presentation API abstracts away what "local" means for displays, meaning that it exposes network-accessible displays as though they were directly attached to the user's device. The Presentation API requires user permission for a page to access any display to mitigate issues that could arise, such as showing unwanted content on a display viewable by others.

7.5 Temporary identifiers and browser state
The presentation URL and presentation identifier can be used to connect to a presentation from another browsing context. They can be intercepted if an attacker can inject content into the controlling page.

7.6 Private browsing mode and clearing of browsing data
The content displayed on the presentation is different from the controller. In particular, if the user is logged in in both contexts, then logs out of the controlling browsing context, they will not be automatically logged out from the receiving browsing context. Applications that use authentication should pay extra care when communicating between devices.

The set of presentations known to the user agent should be cleared when the user requests to "clear browsing data."

When in private browsing mode ("incognito"), the initial set of controlled presentations in that browsing session must be empty. Any presentation connections added to it must be discarded when the session terminates.

7.7 Messaging between presentation connections
This spec will not mandate communication protocols between the controlling browsing context and the receiving browsing context, but it should set some guarantees of message confidentiality and authenticity between corresponding presentation connections.

A. IDL Index
WebIDL
partial interface Navigator {
  [SecureContext, SameObject] readonly attribute Presentation presentation;
};

[SecureContext, Exposed=Window]
interface Presentation {
};

partial interface Presentation {
  attribute PresentationRequest? defaultRequest;
};

partial interface Presentation {
  readonly attribute PresentationReceiver? receiver;
};

[SecureContext, Exposed=Window]
interface PresentationRequest : EventTarget {
  constructor(USVString url);
  constructor(sequence<USVString> urls);
  Promise<PresentationConnection> start();
  Promise<PresentationConnection> reconnect(USVString presentationId);
  Promise<PresentationAvailability> getAvailability();

  attribute EventHandler onconnectionavailable;
};

[SecureContext, Exposed=Window]
interface PresentationAvailability : EventTarget {
  readonly attribute boolean value;

  attribute EventHandler onchange;
};

[SecureContext, Exposed=Window]
interface PresentationConnectionAvailableEvent : Event {
  constructor(DOMString type, PresentationConnectionAvailableEventInit eventInitDict);
  [SameObject] readonly attribute PresentationConnection connection;
};

dictionary PresentationConnectionAvailableEventInit : EventInit {
  required PresentationConnection connection;
};

enum PresentationConnectionState { "connecting", "connected", "closed", "terminated" };

[SecureContext, Exposed=Window]
interface PresentationConnection : EventTarget {
  readonly attribute USVString id;
  readonly attribute USVString url;
  readonly attribute PresentationConnectionState state;
  undefined close();
  undefined terminate();
  attribute EventHandler onconnect;
  attribute EventHandler onclose;
  attribute EventHandler onterminate;

  // Communication
  attribute BinaryType binaryType;
  attribute EventHandler onmessage;
  undefined send (DOMString message);
  undefined send (Blob data);
  undefined send (ArrayBuffer data);
  undefined send (ArrayBufferView data);
};

enum PresentationConnectionCloseReason { "error", "closed", "wentaway" };

[SecureContext, Exposed=Window]
interface PresentationConnectionCloseEvent : Event {
  constructor(DOMString type, PresentationConnectionCloseEventInit eventInitDict);
  readonly attribute PresentationConnectionCloseReason reason;
  readonly attribute DOMString message;
};

dictionary PresentationConnectionCloseEventInit : EventInit {
  required PresentationConnectionCloseReason reason;
  DOMString message = "";
};

[SecureContext, Exposed=Window]
interface PresentationReceiver {
  readonly attribute Promise<PresentationConnectionList> connectionList;
};

[SecureContext, Exposed=Window]
interface PresentationConnectionList : EventTarget {
  readonly attribute FrozenArray<PresentationConnection> connections;
  attribute EventHandler onconnectionavailable;
};