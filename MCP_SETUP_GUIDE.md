# MCP 서버 설정 가이드

이 가이드는 Claude Code에서 MCP(Model Context Protocol) 서버를 설정하여 더 나은 협업 환경을 구축하는 방법을 안내합니다.

## MCP란?

MCP(Model Context Protocol)는 Claude가 외부 도구, 데이터베이스, API 등과 통신할 수 있게 해주는 프로토콜입니다. MCP 서버를 추가하면 Claude의 기능을 확장할 수 있습니다.

## 설정 방법

### 1. Claude Code 설정 파일 위치

Claude Code는 다음 위치의 설정 파일을 사용합니다:

**macOS/Linux:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. 기본 설정 구조

설정 파일이 없다면 다음 구조로 생성하세요:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## 이 프로젝트에 유용한 MCP 서버

### 1. Filesystem MCP (권장)

파일 시스템 작업을 개선합니다.

```bash
# 설치
npm install -g @modelcontextprotocol/server-filesystem
```

**설정 추가:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    }
  }
}
```

### 2. Git MCP

Git 작업을 향상시킵니다.

```bash
# 설치
npm install -g @modelcontextprotocol/server-git
```

**설정 추가:**
```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git",
        "--repository",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    }
  }
}
```

### 3. Brave Search MCP (웹 검색)

API 문서나 최신 정보 검색에 유용합니다.

```bash
# 설치
npm install -g @modelcontextprotocol/server-brave-search
```

**설정 추가:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key"
      }
    }
  }
}
```

Brave API 키: https://brave.com/search/api/

### 4. Playwright MCP

브라우저 자동화 및 테스트에 유용합니다 (이미 Playwright가 있지만 MCP로도 사용 가능).

```bash
# 설치
npm install -g @modelcontextprotocol/server-playwright
```

**설정 추가:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ]
    }
  }
}
```

## 완성된 설정 예시

모든 서버를 추가한 최종 설정 파일 예시:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git",
        "--repository",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key-here"
      }
    },
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ]
    }
  }
}
```

## 설정 적용

1. 위 내용을 `claude_desktop_config.json` 파일에 저장
2. Claude Desktop 또는 Claude Code를 재시작
3. MCP 서버가 자동으로 연결됩니다

## 확인 방법

Claude Code에서 다음과 같이 확인할 수 있습니다:

1. Claude Code 실행
2. 채팅창에서 "사용 가능한 MCP 도구를 보여줘" 라고 요청
3. 연결된 MCP 서버 목록이 표시됩니다

## 문제 해결

### MCP 서버가 연결되지 않을 때

1. **경로 확인**: 프로젝트 경로가 정확한지 확인
2. **권한 확인**: 파일 시스템 접근 권한 확인
3. **로그 확인**: Claude Code의 개발자 도구에서 로그 확인
4. **재시작**: Claude Code 완전히 종료 후 재시작

### npx 명령어가 안 될 때

```bash
# Node.js 버전 확인 (16 이상 필요)
node --version

# npm 업데이트
npm install -g npm@latest
```

## 이 프로젝트에 맞는 커스텀 MCP 서버 (선택사항)

Udemy DOM 분석이나 자막 처리 같은 프로젝트 특화 작업을 위한 커스텀 MCP 서버를 만들 수도 있습니다.

관심 있으시면 말씀해주세요!

## 참고 자료

- [MCP 공식 문서](https://modelcontextprotocol.io)
- [MCP 서버 목록](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP 가이드](https://docs.anthropic.com/claude/docs/model-context-protocol)

## 추천 설정 (최소)

시작하기에 가장 좋은 조합:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git",
        "--repository",
        "/Users/imsejun/Documents/udemy_translation"
      ]
    }
  }
}
```

이 두 개만으로도 파일 작업과 Git 작업이 크게 개선됩니다!
