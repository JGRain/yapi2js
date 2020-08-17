# YFEApi2TS

## v1.1.0

### Added

- 新增:初始化配置文件 ```yfeapi2ts init``` 时，带入参数 ```ts``` 或是 ```js``` 指定生成类型
- 增加:RESTFul风格地址支持

### Changed

- 整理、优化说明文档，优化cli交互输出。
- 修复: 获取API文档失败时，程序报错，无提示，未正常退出的问题。

## v1.0.9

### Changed

- 修改说明文档。
- 发布到npmjs

## v1.0.7

### Changed

- 支持多项目接口生成支持

## v1.0.6

### Changed

- 增加是否开启changelog选项, 不填则不开启

## v1.0.5

### Changed

- get方法 入参interface 类型为string | number

## v1.0.4

### Added

- 查看版本号 `yfeapi2ts version`

## v1.0.3

### Added

- 增加 catid exclude、include 参数
- 文件名生成方式可自定义

```JavaScript
generateApiName: (path, _id) => {
  return `Id${_id}`
}
```
