## 커스텀 이벤트

jindo.FileUploader의 커스텀 이벤트는 다음과 같다.

#### sUploadURL {#suploadurl}

파일 선택 완료를 의미한다. sUploadURL 객체의 속성은 다음과 같다.

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| sType | String | 커스텀 이벤트 이름 |
| sValue | String | 선택된 file input의 값 |
| bAllowed | Boolean | 선택된 파일의 형식이 허용되는지 여부(값이 false이면 sMsgNotAllowedExt에 지정된 메시지를 경고 창에 표시) |
| sMsgNotAllowedExt | String | 선택된 파일의 허용되지 않는 경우 표시할 경고 메시지 |
| stop | Function | 호출되면 bAllowed 값과 상관 없이 모든 동작을 수행하지 않는다. |

#### onload {#onload}

업로드가 성공했음을 의미한다. 커스텀 이벤트 핸들링 예제는 다음과 같다
```
oComponent.attach("success", function(oCustomEvent) { ... });
```

onload 객체의 속성은 다음과 같다.

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| sType | String | 커스텀 이벤트 이름 |
| htResult | HashTable | 서버에서 전달해주는 결과 객체. 서버 설정에 따라 유동적으로 선택할 수 있다. |

#### onerror {#onerror}

업로드가 실패했음을 의미한다. 커스텀 이벤트 핸들링 예제는 다음과 같다
```
oComponent.attach("error", function(oCustomEvent) { ... });
```

onerror 객체의 속성은 다음과 같다.

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| sType | String | 커스텀 이벤트 이름 |
| htResult | HashTable | 서버에서 전달해주는 결과 객체. 에러 발생 시 오류 메시지 문자열 값을 갖는errstr 속성을 반드시 포함하도록 서버 응답을 설정해야 한다. |
