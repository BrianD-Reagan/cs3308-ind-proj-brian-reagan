let server = require("../server");
let chai = require("chai");
let chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp); 
const { expect } = chai;
var assert = chai.assert;

describe("Server!", () => {

    // Test case 1
    it("Load the reviews page", done => {
        chai
        .request(server)
        .get("/")
        .end((err,res) => {
            expect(res).to.have.status(200);
            done();
        });
    });

    // Test case 2
    it("Test TV Maze api", done => {
        chai
        .request(server)
        .get("/tvsearch?tvsearch=Futurama")
        .end((err,res) => {
            expect(res).to.have.status(200);
            done();
        });
    });

});