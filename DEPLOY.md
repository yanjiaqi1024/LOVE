## 目标

把本项目部署到一台只有 IP 访问的服务器上，使用 MySQL 作为数据库，Docker Compose 一键启动。

## 服务器准备

1. 安装 Docker 与 Docker Compose（建议使用 Docker 官方安装方式）
2. 服务器放行端口
   - 8000：对外提供访问（先用 IP 访问）

## 部署

1. 把代码放到服务器（任选其一）
   - git clone 到服务器
   - 或把项目打包上传到服务器解压

2. 在项目根目录创建 `.env`
   - 参考 `.env.example`
   - 必改项：`MYSQL_ROOT_PASSWORD`、`MYSQL_PASSWORD`、`COUPLESPACE_SECRET`

3. 启动

```bash
docker compose up -d --build
```

4. 验证
   - `http://<服务器IP>:8000/health` 返回 `{"ok": true}`
   - 打开 `http://<服务器IP>:8000/` 可访问前端页面

## 从 SQLite 迁移到 MySQL（可选）

如果你之前已经有 `backend/app.db` 的数据，需要迁移到 MySQL：

1. 准备 SQLite 文件
   - 把原来的 `app.db` 放到服务器（或任意一台能连到 MySQL 的机器）

2. 执行迁移脚本（在项目根目录运行）

```bash
python3 backend/scripts/migrate_sqlite_to_mysql.py \
  --sqlite sqlite:////absolute/path/to/app.db \
  --mysql "mysql+pymysql://<user>:<pass>@<host>:3306/<db>?charset=utf8mb4"
```

说明：
- `<host>` 如果在服务器上运行且目标是 Compose 里的 MySQL，默认用 `127.0.0.1`（Compose 已把 3306 仅绑定到本机回环地址）。
- 脚本会先在 MySQL 侧 `create_all` 建表，然后按表把数据拷贝过去。

## 关键环境变量

- `COUPLESPACE_DATABASE_URL`：数据库连接串（Compose 已自动拼好）
- `COUPLESPACE_SECRET`：JWT 密钥（生产环境必须改成随机强密钥）
- `COUPLESPACE_TOKEN_MINUTES`：Token 过期分钟数
- `COUPLESPACE_PBKDF2_ITER`：密码哈希迭代次数
