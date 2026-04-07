#include "./api.h"
#include "./synthesizer-root.h"

IDspCore *createDspCoreInstance() { return new SynthesizerRoot(); }