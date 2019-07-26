describe("sample test", () => {
    it("adds 1 + 2 to equal 3", () => {
        // given
        const a = 1;
        const b = 2;

        // when
        const sum = a + b;

        // then
        expect(sum).toEqual(3);
    });
});
