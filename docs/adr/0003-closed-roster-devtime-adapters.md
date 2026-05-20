# Closed Roster with dev-time Adapter training

Per-Player Adapters are trained at dev-time for a fixed Roster of named Players and shipped with each release; the runtime does not accept arbitrary Player names from end-users to train new Adapters on demand. The decision rejects the open-roster alternative because runtime training would require a job queue, GPU scheduling, failure handling, and abuse mitigation — infrastructure that would expand scope significantly past the (C)-grade usable-tool target and would also produce Adapter quality that varies per request (no human in the loop to validate hyperparameters or evaluation results before exposing the Adapter to users).

An open-roster extension is a natural v2 path — Adapter weights can be added to the deployment by retraining offline and shipping a new release without touching the serving code. The v1 scope deliberately excludes it.
