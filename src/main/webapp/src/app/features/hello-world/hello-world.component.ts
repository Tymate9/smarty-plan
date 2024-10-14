import { Component } from '@angular/core';

@Component({
  selector: 'app-hello-world',
  template: `
    <p>
      hello-world works!
    </p>
    <button (click)="helloWorld()"></button>
  `,
  styles: [
  ]
})
export class HelloWorldComponent {

  async helloWorld(){
    const res = await fetch("http://localhost:8080/hello")
    alert(await res.text())
  }

}
