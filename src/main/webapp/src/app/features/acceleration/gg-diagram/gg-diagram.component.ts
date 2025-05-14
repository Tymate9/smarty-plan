import {Component, Input} from '@angular/core';
import {dto} from "../../../../habarta/dto";
import GGDiagramDTO = dto.GGDiagramDTO;
import * as PlotlyJS from 'plotly.js-dist-min';
import {PlotlyModule} from "angular-plotly.js";

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
  selector: 'gg-diagram',
  standalone: true,
  imports: [PlotlyModule],
  templateUrl: './gg-diagram.component.html',
  styleUrl: './gg-diagram.component.scss'
})
export class GgDiagramComponent {

  private _ggDiagram: any;
  get ggDiagram(): any {
    return this._ggDiagram
  }
  @Input() set ggDiagram(value: GGDiagramDTO[]) {
    this._ggDiagram = this.transformJsonData(value)
  }

  private defaultProjection: string = 'XY'
  @Input() ggProjection?: string

  private max_accel = 1000
  private max_bucket = 100
  private gg_width = this.max_bucket * 2 + 1

  private x = Array.from({length: this.gg_width}, (x, i) => i - this.max_bucket)
  private y = Array.from({length: this.gg_width}, (x, i) => i - this.max_bucket)

  private tickStep = this.max_bucket / 4
  private tickVals = this.x.filter(i => i % this.tickStep == 0)
  private tickText = this.tickVals.map(i => i * this.max_accel / this.max_bucket)

  private transformJsonData(data?: GGDiagramDTO[]) {
    let z = Array.from({length: this.gg_width}, (x, i) => Array(this.gg_width).fill(-7))
    if (data) {
      for (let accel of data) {
        z[accel.idxVert + this.max_bucket][accel.idxHoriz + this.max_bucket] = accel.value
      }
    }

    return [{
      x: this.x,
      y: this.y,
      z: z,
      xaxis: 'x',
      yaxis: 'y',
      hovertemplate: this.customHoverTemplate(this.ggProjection || this.defaultProjection),
      type: 'heatmap',
      zmin: -7,
      zmax: 0,
      colorscale: [
        [0, "#2E892E"],
        [0.5, "#DEDE1F"],
        [1, "#BB0000"]
      ],
      showscale: true,
      //hoverinfo: "none"
    }]
  }

  layout = {
    dragmode: false,
    showlegend: false,
    width: 800,
    height: 800,
    //autosize: true,
    margin: {
      t: 55,
      r: 0,
      b: 50,
      l: 40
    },
    xaxis: {
      type: 'linear',
      range: [-this.max_bucket, this.max_bucket],
      tickvals: this.tickVals,
      ticktext: this.tickText,
      tickmode: 'array',
      //domain: [0, 0.85],
      anchor: 'y',
    },
    yaxis: {
      type: 'linear',
      range: [-this.max_bucket, this.max_bucket],
      tickvals: this.tickVals,
      ticktext: this.tickText,
      tickmode: 'array',
      //domain: [0, 0.85],
      anchor: 'x',
    },

    /*yaxis2: {
        type: 'linear',
        domain: [0.85, 1],
        anchor: 'x',
        showticklabels: false,
    },
    xaxis2: {
        type: 'linear',
        domain: [0.85, 1],
        anchor: 'y',
        showticklabels: false,
    },*/
    shapes: [{
      type: 'line',
      x0: -this.max_bucket,
      y0: 0,
      x1: this.max_bucket,
      y1: 0,
      line: {
        width: 1,
        color: 'black',
        dash: 'dot'
      }},
      {
        type: 'line',
        x0: 0,
        y0: -this.max_bucket,
        x1: 0,
        y1: this.max_bucket,
        line: {
          width: 1,
          color: 'black',
          dash: 'dot'
        }}
    ]
  }

  private customHoverTemplate(proj: string): string | undefined {
    switch (proj) {
      case 'XY': return this.hoverTemplate('Longitudinal', 'Latéral')
      case 'XZ': return this.hoverTemplate('Vertical', 'Longitudinal')
      case 'YZ': return this.hoverTemplate('Vertical', 'Latéral')
      default: return undefined
    }
  }

  private hoverTemplate(labelVert: String, labelHoriz: string): string {
    return `${labelVert}: %{y}<br>${labelHoriz}: %{x}<br>Valeur: %{z}<extra></extra>`
  }

}
