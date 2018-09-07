/* @flow */
import { inspect } from 'util';
import { makeFlowClient } from '../';
import moment from 'moment';
import b2bOptions from '../../tests/options';
import { knownConfigurationsToMap } from './retrieveSectorConfigurationPlan';
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

const conditionalTest = global.__DISABLE_B2B_CONNECTIONS__ ? test.skip : test;
const xconditionalTest = xtest;

let Flow;
beforeAll(async () => {
  Flow = await makeFlowClient(b2bOptions);
});

describe('retrieveSectorConfigurationPlan', () => {
  conditionalTest('LFEERMS', async () => {
    try {
      const res = await Flow.retrieveSectorConfigurationPlan({
        dataset: { type: 'OPERATIONAL' },
        day: moment.utc().toDate(),
        airspace: 'LFEECTAN',
      });

      expect(res.data.plan.knownConfigurations).toBeDefined();
      expect(res.data.plan.nmSchedule).toBeDefined();
      expect(res.data.plan.clientSchedule).toBeDefined();

      // $FlowFixMe
      expect(Array.isArray(res.data.plan.nmSchedule.item)).toBe(true);
      expect(Array.isArray(res.data.plan.clientSchedule.item)).toBe(true);
      expect(Array.isArray(res.data.plan.knownConfigurations.item)).toBe(true);

      console.log(res.data.plan.clientSchedule.item);

      res.data.plan.knownConfigurations.item.forEach(conf =>
        expect(conf).toMatchObject({
          key: expect.any(String),
          value: {
            item: expect.anything(),
          },
        }),
      );

      // Test that we can generate a valid map
      const map = knownConfigurationsToMap(res.data.plan.knownConfigurations);

      console.log(map);

      const keys = Array.from(map.keys());
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(k => expect(typeof k).toBe('string'));

      const values = Array.from(map.values());
      expect(values.length).toBeGreaterThan(0);
      values.forEach(v => {
        expect(Array.isArray(v)).toBe(true);
      });

      const testSchedule = conf => {
        expect(conf).toMatchObject({
          applicabilityPeriod: {
            wef: expect.any(Date),
            unt: expect.any(Date),
          },
          dataSource: expect.any(String),
          // sectorConfigurationId: expect.any(String),
        });

        if (conf.sectorConfigurationId) {
          expect(keys).toContain(conf.sectorConfigurationId);
        }
      };

      res.data.plan.nmSchedule.item.forEach(testSchedule);
      res.data.plan.clientSchedule.item.forEach(testSchedule);
    } catch (err) {
      console.log(inspect(err, { depth: null }));
      throw err;
    }
  });
});
