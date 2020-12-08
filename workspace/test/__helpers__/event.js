export const simulateEvent = function(element, eventName, initDict = {}, bubbles = true, cancelable = true) {
    const event = document.createEvent("Event");
    event.initEvent(eventName, bubbles, cancelable);
    Object.keys(initDict).forEach((key) => {
        event[key] = initDict[key];
    });
    element.dispatchEvent(event);

    return event;
};

export default {
    simulateEvent
};