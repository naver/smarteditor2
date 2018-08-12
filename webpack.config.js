const path = require('path');

module.exports = {
	mode: 'development',
	entry: './workspace/js/service/SE2BasicCreator.js',
	devServer: {
		contentBase: path.join(__dirname, 'workspace'),
		openPage: 'SmartEditor2.html'
	}
};