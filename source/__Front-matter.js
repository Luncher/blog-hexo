var fs = require('fs');
var path = require('path');

var dir = process.argv[2] || 'misc';
var categories = path.basename(dir);

fs.readdir(dir, function(err, files) {
    files.forEach(function(it) {
        var name = it.split('.')[0];
        var filepath = path.join(dir, it);
        console.log(filepath);
        var data = fs.readFileSync(filepath, 'utf8');
        if(data.search(/^title\:/m) === -1) {
            data = '---\n' +
                'title: ' + name + '\n' +
                'categories: ' + categories + '\n' +
                '---\n' + data;
            fs.writeFileSync(filepath, data, 'utf8');
        }
    });
});
