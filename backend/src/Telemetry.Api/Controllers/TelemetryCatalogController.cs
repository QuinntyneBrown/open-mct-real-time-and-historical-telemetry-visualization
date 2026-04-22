using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Telemetry.Api.Configuration;

namespace Telemetry.Api.Controllers
{
    [ApiController]
    [Route("api/telemetry/catalog")]
    public class TelemetryCatalogController : ControllerBase
    {
        private readonly TelemetryOptions _options;
        public TelemetryCatalogController(IOptions<TelemetryOptions> options)
        {
            _options = options.Value;
        }

        [HttpGet]
        public IActionResult GetCatalog()
        {
            return Ok(_options.TelemetryIdentifiers);
        }
    }
}