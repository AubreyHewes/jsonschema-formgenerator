
var inputRenderers = {};

/**
 *
 * @export
 *
 * @param id
 *
 * @param callback (propConfig, path, value, id)
 *
 */
function addInputRenderer(id, callback) {
	inputRenderers[id] = callback;
}

/**
 *
 * @param id
 *
 * @returns {boolean}
 */
function hasInputRenderer(id) {
	return typeof inputRenderers[id] !== "undefined";
}

/**
 *
 * @returns string
 */
function applyInputRenderer() {
	var type = [].shift.call(arguments);
	if (!inputRenderers[type]) {
		return '';
	}
	return inputRenderers[type].apply(this, arguments);
}
