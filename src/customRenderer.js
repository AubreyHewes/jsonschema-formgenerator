
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
 * @param propConfig
 * @param path
 * @param name
 * @param value
 * @param id
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
