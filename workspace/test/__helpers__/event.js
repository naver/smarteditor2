export const simulateEvent = function(element, eventName) {
    const event = document.createEvent("Event");
    event.initEvent(eventName, true, true);
    element.dispatchEvent(event);
};

export default {
    simulateEvent
};