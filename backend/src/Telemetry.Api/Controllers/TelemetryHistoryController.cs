using Microsoft.AspNetCore.Mvc;
using Telemetry.Api.Models;
using Telemetry.Api.Services;

namespace Telemetry.Api.Controllers
{
    [ApiController]
    [Route("api/telemetry/history")]
    public class TelemetryHistoryController : ControllerBase
    {
        private readonly TelemetryRepository _repo;
        public TelemetryHistoryController(TelemetryRepository repo)
        {
            _repo = repo;
        }

        [HttpPost]
        public async Task<ActionResult<TelemetryHistoryCursorResponse>> Post([FromBody] TelemetryHistoryCursorRequest req, CancellationToken ct)
        {
            var result = await _repo.GetHistoryPageAsync(req, ct);
            return Ok(result);
        }
    }
}
