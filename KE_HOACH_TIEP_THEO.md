# KẾ HOẠCH TRIỂN KHAI TIẾP THEO

## 1. Trạng thái hiện tại

- API `/api/chat` đã kết nối và gọi được Ollama.
- Backend hiện mới chuyển trực tiếp prompt của người dùng tới LLM.
- Model `qwen2.5-coder:7b` vẫn đang được hard-code.
- Chưa có `BaseAgent`, Planner, Coder, Tester và Orchestrator hoàn chỉnh.
- `review_agent.py` đang trống.
- Frontend đang hiển thị dữ liệu mẫu và chưa gọi API thật.

## 2. Thứ tự triển khai

### Bước 1 — Chốt API contract

Sử dụng API chính cho pipeline:

```text
POST /api/projects
GET  /api/projects/{project_id}
GET  /api/projects/{project_id}/download
```

Trong đó:

- `POST /api/projects`: nhận yêu cầu, tạo tác vụ và trả về `project_id`.
- `GET /api/projects/{project_id}`: trả về trạng thái project và từng Agent.
- `GET /api/projects/{project_id}/download`: đóng gói và tải source code dạng ZIP.

Endpoint `/api/chat` có thể được giữ lại để kiểm tra kết nối Ollama, nhưng không dùng làm API chính của pipeline.

### Bước 2 — Hoàn thiện backend foundation

Tạo cấu trúc:

```text
backend/app/
├── config.py
├── agents/
│   └── base_agent.py
├── schemas/
│   └── project.py
├── workflow/
│   └── orchestrator.py
└── workspace/
    └── manager.py
```

Công việc cần thực hiện:

- Đọc cấu hình từ `.env`.
- Không hard-code model trong endpoint hoặc Agent.
- Khai báo model, Ollama URL, timeout và số lần retry trong config.
- Xây dựng schema chung cho input, output và trạng thái Agent.
- Tạo interface thống nhất cho các Agent.

Ví dụ cấu hình:

```env
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5-coder:7b  
OLLAMA_BASE_URL=http://localhost:11434
LLM_TIMEOUT=180
MAX_RETRY=2
```

### Bước 3 — Xây dựng Planner Agent

Planner nhận yêu cầu của người dùng và trả về `PlannerResult` có cấu trúc rõ ràng:

```text
project_name
description
technologies
features
database
apis
project_structure
```

Yêu cầu:

- Tạo system prompt riêng cho Planner.
- Yêu cầu LLM trả JSON có cấu trúc.
- Kiểm tra và parse kết quả bằng Pydantic.
- Không truyền dữ liệu giữa các Agent bằng string tùy ý.
- Viết test với ít nhất ba yêu cầu mẫu:
  - REST API quản lý sinh viên.
  - Todo application.
  - Blog API.

### Bước 4 — Tạo và quản lý project workspace

Mỗi request tạo một workspace riêng:

```text
generated_projects/<project_id>/
├── project/
├── .agent/
├── logs/
└── metadata.json
```

Quản lý lifecycle:

```text
queued
  ↓
running
  ↓
completed
```

Khi xảy ra lỗi:

```text
running
  ↓
failed
```

Mỗi Agent có trạng thái riêng:

```text
pending
running
completed
failed
```

### Bước 5 — Xây dựng các Agent còn lại

Chỉ thực hiện sau khi Planner chạy ổn định.

Thứ tự:

```text
Coder Agent + File Tools
          ↓
Tester Agent + Execution Tools
          ↓
Reviewer Agent
          ↓
Orchestrator hoàn chỉnh
```

Yêu cầu an toàn:

- Coder chỉ được ghi file bên trong workspace của project.
- Tester chỉ được chạy những command nằm trong allowlist.
- Mọi command phải có timeout.
- Không cho Agent truy cập tùy ý ra ngoài `generated_projects`.

### Bước 6 — Kết nối frontend với backend

Thay dữ liệu mẫu bằng dữ liệu thật:

```text
Người dùng nhập yêu cầu
          ↓
POST /api/projects
          ↓
Nhận project_id
          ↓
Polling GET /api/projects/{project_id}
          ↓
Hiển thị trạng thái từng Agent
          ↓
Cho phép tải source ZIP khi hoàn thành
```

Phiên bản MVP dùng polling. Chưa cần WebSocket hoặc streaming.

## 3. Công việc ưu tiên gần nhất

Thực hiện theo đúng thứ tự:

- [ ] Tạo `config.py` và `.env.example`.
- [ ] Tạo các Pydantic schema cho project và Agent.
- [ ] Tạo `BaseAgent`.
- [ ] Xây dựng Planner Agent.
- [ ] Viết test cho Planner Agent.
- [ ] Tạo Workspace Manager.
- [ ] Tạo API `POST /api/projects`.
- [ ] Tạo API kiểm tra trạng thái project.
- [ ] Xây dựng Coder Agent và File Tools.
- [ ] Xây dựng Tester Agent và Execution Tools.
- [ ] Hoàn thiện Reviewer Agent.
- [ ] Ghép bốn Agent bằng Orchestrator.
- [ ] Kết nối frontend với API thật.
- [ ] Thực hiện demo end-to-end.

## 4. Mục tiêu của bản MVP

MVP được xem là hoàn thành khi có thể demo luồng sau:

```text
User nhập yêu cầu tạo chương trình
          ↓
Planner tạo specification
          ↓
Coder tạo source code trong workspace
          ↓
Tester chạy kiểm thử và tạo báo cáo
          ↓
Reviewer đánh giá kết quả
          ↓
Frontend hiển thị trạng thái
          ↓
User tải source code dạng ZIP
```

