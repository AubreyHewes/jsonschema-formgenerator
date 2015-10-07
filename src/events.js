
var eventHandlers = [];

function addEventHandler(fn) {
	eventHandlers.push(fn);
}

function applyEventHandlers() {
	eventHandlers.forEach(function (fn) {
		fn();
	});
}