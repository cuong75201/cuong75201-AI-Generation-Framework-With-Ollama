# AI Content Generation Framework

Framework tạo project phần mềm từ yêu cầu ngôn ngữ tự nhiên bằng một pipeline AI Agent. Người dùng nhập yêu cầu trên giao diện chat, backend tạo workspace riêng, chạy Planner bằng mô hình Ollama và trả kế hoạch có cấu trúc để frontend hiển thị.

## Luồng hoạt động

```text
Người dùng nhập requirement
          │
          ▼
POST /api/projects
          │
          ├── Tạo workspace và project_id
          ├── Trả project_id cho frontend
          └── Chạy Planner trong BackgroundTasks
                         │
                         ▼
                 Ollama /api/chat
                         │
                         ▼
                   PlannerResult
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
.agent/planner.json       GET /api/projects/{id}
                                        │
                                        ▼
                         Frontend hiển thị kế hoạch
```

Frontend polling API trạng thái trong lúc Planner đang chạy. Khi hoàn thành, giao diện hiển thị tên project, mô tả, công nghệ, tính năng, database, API dự kiến và cấu trúc thư mục.

## Công nghệ

### Backend

- Python 3.11+
- FastAPI
- Pydantic v2 và Pydantic Settings
- HTTPX
- Ollama

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Lucide React

## Cấu trúc project

```text
AI-Content-Generation-Framework/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── base_agent.py
│   │   │   └── planner_agent.py
│   │   ├── llm/
│   │   │   └── provider.py
│   │   ├── router/
│   │   │   └── projects.py
│   │   ├── schema/
│   │   │   ├── agent.py
│   │   │   ├── planner.py
│   │   │   ├── project.py
│   │   │   └── response.py
│   │   ├── workflow/
│   │   │   └── orchestrator.py
│   │   ├── workspace/
│   │   │   └── manager.py
│   │   ├── config.py
│   │   └── main.py
│   ├── generated_projects/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── pages/
│   └── package.json
└── README.md
```

## Yêu cầu môi trường

- Python 3.11 trở lên
- Node.js `^20.19.0` hoặc `>=22.12.0`
- npm
- [Ollama](https://ollama.com/) đang chạy trên máy
- Model mặc định `qwen2.5-coder:7b`

## Cài đặt và chạy

### 1. Chuẩn bị Ollama

Tải model mặc định:

```bash
ollama pull qwen2.5-coder:7b
```

Kiểm tra Ollama:

```bash
ollama list
```

Ollama mặc định phục vụ tại `http://localhost:11434`.

### 2. Chạy backend

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend chạy tại `http://localhost:8000`. Swagger UI có tại `http://localhost:8000/docs`.

### 3. Chạy frontend

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại địa chỉ Vite in ra terminal, thông thường là `http://localhost:5173`. Trong môi trường development, Vite proxy các request `/api` sang backend tại `http://localhost:8000`.

## Cấu hình

Backend đọc cấu hình từ `backend/.env`:

```env
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434
LLM_TIMEOUT=180
MAX_RETRY=2
```

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `LLM_PROVIDER` | Provider LLM; hiện chỉ hỗ trợ Ollama | `ollama` |
| `LLM_MODEL` | Tên model dùng để sinh nội dung | `qwen2.5-coder:7b` |
| `OLLAMA_BASE_URL` | URL của Ollama | `http://localhost:11434` |
| `LLM_TIMEOUT` | Timeout mỗi request, tính bằng giây | `180` |
| `MAX_RETRY` | Số lần thử lại sau request đầu tiên | `2` |

Provider tự retry khi gặp timeout, lỗi mạng, HTTP `429` hoặc lỗi `5xx`.

## API

Mọi JSON response thông thường sử dụng envelope:

```json
{
  "status": true,
  "status_code": 200,
  "message": "Success",
  "data": {},
  "error": null
}
```

### Tạo project và chạy Planner

```http
POST /api/projects
Content-Type: application/json
```

Request:

```json
{
  "requirement": "Tạo REST API quản lý sinh viên bằng FastAPI và PostgreSQL"
}
```

Response trả về ngay với HTTP `201`:

```json
{
  "status": true,
  "status_code": 201,
  "message": "Project created successfully",
  "data": {
    "project_id": "c867b82366ac4504a413b47dad6f2d19",
    "status": "queued",
    "message": "Project created and queued for processing",
    "created_at": "2026-10-16T10:00:00Z"
  },
  "error": null
}
```

Planner tiếp tục chạy trong background sau khi response được gửi.

### Xem trạng thái và kết quả Planner

```http
GET /api/projects/{project_id}
```

Trong lúc chạy:

```json
{
  "data": {
    "project_id": "c867b82366ac4504a413b47dad6f2d19",
    "status": "running",
    "current_agent": "planner",
    "steps": {
      "planner": "running",
      "coder": "pending",
      "tester": "pending",
      "reviewer": "pending"
    },
    "planner_result": null,
    "error": null
  }
}
```

Khi Planner hoàn thành, `planner_result` có dạng:

```json
{
  "project_name": "student-management-api",
  "description": "REST API quản lý sinh viên",
  "technologies": ["Python", "FastAPI", "PostgreSQL"],
  "features": ["Quản lý sinh viên", "Tìm kiếm và phân trang"],
  "database": "PostgreSQL",
  "apis": [
    {
      "method": "GET",
      "path": "/students",
      "description": "Lấy danh sách sinh viên"
    }
  ],
  "project_structure": ["app/main.py", "app/routes/students.py"]
}
```

Các trạng thái hợp lệ của project và Agent:

```text
queued → running → completed
                 ↘ failed
```

### Download source code

```http
GET /api/projects/{project_id}/download
```

API trả file `project_<project_id>.zip`. ZIP chỉ chứa nội dung trong thư mục `project/`, không chứa metadata, logs hoặc dữ liệu nội bộ của Agent.

### Kiểm tra kết nối LLM

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "message": "Viết một hàm Python tính Fibonacci"
}
```

Endpoint này dùng để kiểm tra kết nối Ollama, không phải API chính của pipeline.

## Project workspace

Mỗi request tạo một workspace độc lập:

```text
backend/generated_projects/<project_id>/
├── project/              # Source code để download
├── .agent/
│   └── planner.json      # Kết quả có cấu trúc của Planner
├── logs/                 # Dành cho log workflow
└── metadata.json         # Trạng thái project và từng Agent
```

Metadata và kết quả Planner được ghi dưới dạng JSON UTF-8. Việc ghi metadata sử dụng file tạm rồi replace để hạn chế frontend đọc trúng dữ liệu đang ghi dở.

## Kiến trúc Agent

Mọi Agent kế thừa interface chung:

```python
class BaseAgent(ABC, Generic[InputT, OutputT]):
    name: str
    role: str
    system_prompt: str

    @abstractmethod
    async def run(
        self,
        agent_input: AgentInput[InputT],
    ) -> AgentOutput[OutputT]:
        ...
```

`WorkflowOrchestrator` chạy các Agent theo thứ tự, truyền structured output sang bước tiếp theo và dừng workflow nếu một Agent thất bại.

## Kiểm tra và build

Kiểm tra backend:

```bash
cd backend
python -m compileall -q app
```

Type-check frontend:

```bash
cd frontend
npx tsc -b
```

Build frontend:

```bash
npm run build
```

