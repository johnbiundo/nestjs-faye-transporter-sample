import { Injectable } from '@nestjs/common';
import * as Promise from 'bluebird';

@Injectable()
export class WorkService {
  /**
   * Simple asynchronous job step simulator; bulding block to simulate multi-step
   * asynchronous jobs (e.g., multiple asynchornous microservice requests)
   *
   * Simulates a single step job; returns a promise that resolves with a response
   * when the job is complete. Promise resolves with:
   *   {
   *      status: string,   // result status message
   *      workTime: number  // the length of time the step took
   *   }
   *
   * To simulate multiple steps taking different amounts of time, call this in a
   * series (e.g., `Bluebird Promise.mapSeries`), passing in a step number for each
   * job step.  The step number is a multiplier for the duration that a
   * `standard step` takes.
   *
   * With this, we can define jobs that take some multiple of the standard step's
   * amount of time to complete.
   *
   * For example, we can simulate a 3 step job where
   * step 1 takes 2 seconds
   * step 2 takes 4 seconds (twice as long because it's step 2, and 2 is the multiplier)
   * step 3 takes 6 seconds (three times as long because it's step 3 and 3 is the multiplier)
   *
   * Do the above by calling
   *  `doStep(1, duration)`
   *  `doStep(2, duration)`
   *  `doStep(3, duration)`
   *
   * @param step number - multiplier (e.g., "this job takes 3 times as long as normal" wouild use 3)
   * @param duration number - duration of basic task
   */
  doStep(step, duration): Promise<any> {
    // sleeper
    function sleep(seconds): Promise<any> {
      return new Promise(resolve => {
        setTimeout(() => resolve(), seconds * 1000);
      });
    }

    // wait step * duration seconds, then resolve with job results
    const workTime = step * duration;
    return new Promise(async resolve => {
      await sleep(workTime);
      resolve({
        status: `Step ${step} Complete after ${workTime} seconds.`,
        workTime,
      });
    });
  }

  /**
   * Runs a 3 step job, with (assuming duration is 3)
   *   step 1 taking 1 unit of time (e.g., step 1 takes 3 seconds)
   *   step 2 takeing 2 units (e.g., 6 seconds)
   *   step 3 takinng 3 units (e.g., 9 seconds)
   *
   * @param duration number - the base duration of the task
   */
  doThreeSteps(duration): Promise<any> {
    const jobs = [1, 2, 3].map(job => this.doStep(job, duration));
    return Promise.mapSeries(jobs, jobResult => jobResult.workTime).then(
      results => {
        return {
          jobCount: results.length,
          totalWorkTime: results.reduce((acc, val) => acc + val, 0),
        };
      },
    );
  }
}
