
var renderers = {};

/**
 *
 * @export
 *
 * @param id
 *
 * @param callback (propConfig, path, value, id)
 *
 */
function addRenderer(id, callback) {
	renderers[id] = callback;
}

/**
 *
 * @param id
 *
 * @returns {boolean}
 */
function hasRenderer(id) {
	return typeof renderers[id] !== "undefined";
}

/**
 *
 * @returns string
 */
function applyRenderer() {
	var type = [].shift.call(arguments);
	if (!renderers[type]) {
		return '';
	}
	return renderers[type].apply(this, arguments);
}
