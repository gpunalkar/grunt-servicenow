# ServiceNow Grunt Tasks
Grunt task used to work with servicenow instance 

### Installation

You need Grunt CLI installed globally:
```sh
$ npm install grunt-servicenow --save-dev
```
## watchAndPush
```sh
$ grunt watch
$ grunt watch:FolderName
```
## pull

### With Prompts
This task will prompt what record type(s) you want to pull down
```sh
$ grunt pull 
```

### Specific Record Type
This pulls down all records in the given record type (e.g. ui_pages, content_css). You can access any record type specific in `.sn-config.json`

**Note** If you want to use a prefix for finding records, use `grunt pull` or `grunt pullLike`

```sh
$ grunt pull:RecordType
```

### Specific Record
This pulls down a specific record from a specific record type (e.g. a ui\_page called __recordName__).

```sh
$ grunt pull:RecordType:RecordName
```

## pullLike
Wraps the pull task and adds a prefix to search a given record type (e.g. find all ui\_pages that start with __prefix__)

```sh
$ grunt pullLike:RecordType:prefix
```

## push
```sh
$ grunt push #(for security reason we might disble this)
$ grunt push:FolderName
$ grunt push:FolderName:FilePath
```
## runserver
```sh
$ grunt runserver #default port 3000
$ grunt runserver:PORT
```
### Version
0.0.1

License
----

MIT

