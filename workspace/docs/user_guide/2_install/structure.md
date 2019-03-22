## 에디터 구조

에디터가 설치되어 있는 SmartEditor2.html 데모 페이지는 다음과 같이 IFRAME으로 에디터 본체를 감싸고 그 안에 IFRAME으로 에디터의 편집 영역을 감싸는 구조이다.

![image068.jpg](/assets/image068.jpg)

그림 34 SmartEditor2.html의 구조

SmartEditor2.html 파일은 에디터가 삽입된 페이지로, HuskyEZCreator.js 파일의 nhn.husky.EZCreator.createInIFrame() 함수를 호출해 에디터를 생성한다. nhn.husky.EZCreator.createInIFrame() 함수는 IFRAME을 생성하여 SmartEditor2Skin.html 파일을 로드한다. SmartEditor2Skin.html 파일 로드가 완료되면 에디터를 생성하는 함수가 호출된다.
