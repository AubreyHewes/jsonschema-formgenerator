/**
 * Append schema defined fields to the current context; optionally filling data.
 *
 * @param schema
 * @param data
 */
$.fn.appendSchema = function (schema, data) {
	renderObject(schema, [], data).then(function (html) {
		$(this).append(html);
	});
};
